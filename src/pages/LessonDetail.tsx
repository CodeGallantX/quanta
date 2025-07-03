
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  content: string;
  subject_id: string;
  evaluation_questions: any[];
}

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

const LessonDetail = () => {
  const { subjectId, lessonId } = useParams<{ subjectId: string; lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;

      try {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        // Check if lesson is already completed
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user?.id)
          .eq('lesson_id', lessonId)
          .single();

        setLesson(lessonData);
        setIsCompleted(!!progressData);
      } catch (error) {
        console.error('Error fetching lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLesson();
    }
  }, [lessonId, user]);

  const handleStartQuestions = () => {
    setShowQuestions(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < lesson!.evaluation_questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    const questions = lesson!.evaluation_questions as Question[];
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === questions[index].correct_answer
    ).length;
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    // Save progress
    try {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user!.id,
          lesson_id: lessonId!,
          score: score,
          completed_at: new Date().toISOString()
        });

      setIsCompleted(true);
      setShowResults(true);
      
      toast({
        title: "Lesson Completed!",
        description: `You scored ${score}% on the evaluation.`
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lesson Not Found</h1>
            <Button onClick={() => navigate(`/dashboard/${subjectId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showQuestions && !showResults) {
    const questions = lesson.evaluation_questions as Question[];
    const question = questions[currentQuestion];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setShowQuestions(false)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lesson
              </Button>
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Evaluation</h1>
                <Badge>
                  Question {currentQuestion + 1} of {questions.length}
                </Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnswers[currentQuestion] === option
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    {option}
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={!selectedAnswers[currentQuestion]}
                    className="w-full"
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Evaluation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const questions = lesson.evaluation_questions as Question[];
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === questions[index].correct_answer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Evaluation Results</CardTitle>
                <div className="text-4xl font-bold text-indigo-600 mt-4">
                  {score}%
                </div>
                <p className="text-gray-600">
                  You got {correctAnswers} out of {questions.length} questions correct
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question, index) => {
                  const isCorrect = selectedAnswers[index] === question.correct_answer;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mt-1" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{question.question}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {selectedAnswers[index]}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-gray-600 mb-2">
                              Correct answer: <span className="text-green-600">
                                {question.correct_answer}
                              </span>
                            </p>
                          )}
                          <p className="text-sm text-gray-500">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={() => navigate(`/dashboard/${subjectId}`)}
                    className="w-full"
                  >
                    Return to Lessons
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowQuestions(false);
                      setShowResults(false);
                    }}
                    className="w-full"
                  >
                    Review Lesson Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/dashboard/${subjectId}`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {subjectId === 'physics' ? 'Physics' : 'Chemistry'}
            </Button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                {isCompleted && (
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lesson.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {lesson.evaluation_questions && lesson.evaluation_questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ready for the Evaluation?</CardTitle>
                <p className="text-gray-600">
                  Test your understanding with {lesson.evaluation_questions.length} questions.
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartQuestions}
                  className="w-full"
                  size="lg"
                >
                  {isCompleted ? 'Retake Evaluation' : 'Start Evaluation'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
