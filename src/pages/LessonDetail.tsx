import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  evaluation_questions: Question[] | null;
}

const LessonDetail = () => {
  const { subjectId, lessonId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .eq('subject_id', subjectId)
          .single();

        if (error) throw error;
        
        // Safely parse evaluation_questions
        let evaluationQuestions: Question[] | null = null;
        if (data.evaluation_questions) {
          try {
            evaluationQuestions = JSON.parse(JSON.stringify(data.evaluation_questions)) as Question[];
          } catch (parseError) {
            console.error('Error parsing evaluation questions:', parseError);
            evaluationQuestions = null;
          }
        }

        setLesson({
          ...data,
          evaluation_questions: evaluationQuestions
        });
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast({
          title: "Error",
          description: "Failed to load lesson",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (lessonId && subjectId) {
      fetchLesson();
    }
  }, [lessonId, subjectId]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!lesson?.evaluation_questions) return;

    const newScore = calculateScore();
    setScore(newScore);
    setSubmitted(true);

    // Save progress to database
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert([
          { 
            user_id: user?.id, 
            lesson_id: lessonId, 
            score: newScore,
            subject_id: subjectId
          }
        ], { onConflict: ['user_id', 'lesson_id'] });

      if (error) throw error;

      toast({
        title: "Evaluation Submitted",
        description: `Your score: ${newScore}%`,
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive"
      });
    }
  };

  const calculateScore = () => {
    if (!lesson?.evaluation_questions) return 0;

    let correctAnswers = 0;
    lesson.evaluation_questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    return Math.round((correctAnswers / lesson.evaluation_questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
            <Link to={`/dashboard/${subjectId}`}>
              <Button>Back to Lessons</Button>
            </Link>
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
          {/* Header */}
          <div className="mb-6">
            <Link to={`/dashboard/${subjectId}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
          </div>

          {!showEvaluation ? (
            /* Lesson Content */
            <div className="space-y-6">
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {lesson.evaluation_questions && lesson.evaluation_questions.length > 0 && (
                <div className="text-center">
                  <Button 
                    onClick={() => setShowEvaluation(true)}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Take Evaluation
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Evaluation Questions */
            <Card>
              <CardHeader>
                <CardTitle>Lesson Evaluation</CardTitle>
                <CardDescription>
                  Answer the following questions to test your understanding.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!submitted ? (
                  <div className="space-y-6">
                    {lesson.evaluation_questions?.map((question, index) => (
                      <div key={index} className="border-b pb-6 last:border-b-0">
                        <h3 className="text-lg font-medium mb-4">
                          {index + 1}. {question.question}
                        </h3>
                        <RadioGroup
                          value={answers[index] || ''}
                          onValueChange={(value) => setAnswers(prev => ({
                            ...prev,
                            [index]: value
                          }))}
                        >
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={option} 
                                id={`q${index}-option${optionIndex}`}
                              />
                              <Label htmlFor={`q${index}-option${optionIndex}`}>
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                    
                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowEvaluation(false)}
                      >
                        Back to Lesson
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length !== lesson.evaluation_questions?.length}
                      >
                        Submit Evaluation
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Results */
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      {score >= 70 ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                      <h3 className="text-2xl font-bold">
                        Your Score: {score}%
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {score >= 70 ? 'Great job! You passed the evaluation.' : 'Keep studying and try again!'}
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEvaluation(false);
                          setSubmitted(false);
                          setAnswers({});
                          setScore(0);
                        }}
                      >
                        Review Lesson
                      </Button>
                      <Link to={`/dashboard/${subjectId}`}>
                        <Button>Back to Lessons</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
