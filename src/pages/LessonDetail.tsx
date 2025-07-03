
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  subject_id: string;
  evaluation_questions: Question[];
}

const LessonDetail = () => {
  const { subjectId, lessonId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchLesson();
    checkCompletion();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      // Type assertion to handle the Json type from Supabase
      const lessonData: Lesson = {
        ...data,
        evaluation_questions: Array.isArray(data.evaluation_questions) 
          ? data.evaluation_questions as Question[]
          : []
      };
      
      setLesson(lessonData);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const checkCompletion = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (data) {
        setCompleted(true);
      }
    } catch (error) {
      // No progress found, which is fine
    }
  };

  const handleStartEvaluation = () => {
    setShowEvaluation(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (lesson?.evaluation_questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = async () => {
    if (!lesson || !user) return;

    let correctAnswers = 0;
    lesson.evaluation_questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / lesson.evaluation_questions.length) * 100);
    setScore(percentage);
    setShowResults(true);

    // Save progress
    try {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId!,
          score: percentage,
          completed_at: new Date().toISOString()
        });
      
      setCompleted(true);
      toast.success(`Lesson completed! Score: ${percentage}%`);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson not found</h2>
            <Link to={`/dashboard/${subjectId}`}>
              <Button>Back to Lessons</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link
                to={`/dashboard/${subjectId}`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to {subjectId === 'physics' ? 'Physics' : 'Chemistry'}
              </Link>
              {completed && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>

            {!showEvaluation ? (
              // Lesson Content
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
                  <Badge className="mb-4">
                    {subjectId === 'physics' ? 'Physics' : 'Chemistry'}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="prose prose-lg max-w-none p-8">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {lesson.content}
                    </ReactMarkdown>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button
                    onClick={handleStartEvaluation}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Start Evaluation ({lesson.evaluation_questions.length} questions)
                  </Button>
                </div>
              </div>
            ) : (
              // Evaluation Section
              <div className="space-y-6">
                {!showResults ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Question {currentQuestion + 1} of {lesson.evaluation_questions.length}</span>
                        <Badge variant="outline">
                          {Math.round(((currentQuestion + 1) / lesson.evaluation_questions.length) * 100)}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <h3 className="text-xl font-semibold">
                        {lesson.evaluation_questions[currentQuestion]?.question}
                      </h3>
                      
                      <div className="space-y-3">
                        {lesson.evaluation_questions[currentQuestion]?.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                              answers[currentQuestion] === option
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setShowEvaluation(false)}
                        >
                          Back to Lesson
                        </Button>
                        <Button
                          onClick={handleNextQuestion}
                          disabled={!answers[currentQuestion]}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {currentQuestion < lesson.evaluation_questions.length - 1 ? 'Next Question' : 'Finish'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Results
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          {score >= 70 ? (
                            <CheckCircle className="h-16 w-16 text-green-500" />
                          ) : (
                            <XCircle className="h-16 w-16 text-red-500" />
                          )}
                        </div>
                        Your Score: {score}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <p className="text-lg text-gray-600 mb-6">
                          {score >= 70 ? 'Great job! You passed the evaluation.' : 'Keep studying and try again!'}
                        </p>
                      </div>

                      {/* Answer Review */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Review Your Answers:</h3>
                        {lesson.evaluation_questions.map((question, index) => {
                          const userAnswer = answers[index];
                          const isCorrect = userAnswer === question.correct_answer;
                          
                          return (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3 mb-2">
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{question.question}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                      {userAnswer}
                                    </span>
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-sm text-green-600 mt-1">
                                      Correct answer: {question.correct_answer}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-500 mt-2">
                                    {question.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowEvaluation(false)}
                        >
                          Review Lesson
                        </Button>
                        <Link to={`/dashboard/${subjectId}`}>
                          <Button className="bg-indigo-600 hover:bg-indigo-700">
                            Back to Lessons
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
