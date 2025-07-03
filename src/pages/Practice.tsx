import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Shuffle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  subject_id: string;
  topic: string;
  difficulty: string;
}

const Practice = () => {
  const { subjectId } = useParams();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let query = supabase
          .from('practice_questions')
          .select('*');

        if (subjectId) {
          query = query.eq('subject_id', subjectId);
        }

        const { data, error } = await query.limit(10);

        if (error) throw error;

        // Safely parse the options field
        const parsedQuestions = data?.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options as string[] : []
        })) || [];

        setQuestions(parsedQuestions);
      } catch (error) {
        console.error('Error fetching practice questions:', error);
        toast({
          title: "Error",
          description: "Failed to load practice questions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subjectId]);

  const handleAnswerSelect = (value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: value
    }));
  };

  const handleNext = () => {
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });
    return (correctAnswers / questions.length) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-500';
      case 'Medium':
        return 'text-yellow-500';
      case 'Hard':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Practice Questions Available</h1>
            <p className="text-gray-600 mb-4">
              Practice questions for this subject are not available yet.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Practice Questions
                {subjectId && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    • {subjectId.charAt(0).toUpperCase() + subjectId.slice(1)}
                  </span>
                )}
              </h1>
              <Button
                variant="outline"
                onClick={() => {
                  setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                  setShowResults(false);
                }}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Shuffle
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          {!showResults ? (
            /* Question Card */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {currentQuestion.question}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      {currentQuestion.topic}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`${currentQuestion.difficulty === 'Easy' ? 'text-green-600' : 
                        currentQuestion.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={userAnswers[currentQuestionIndex] || ''}
                  onValueChange={(value) => setUserAnswers(prev => ({
                    ...prev,
                    [currentQuestionIndex]: value
                  }))}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${index}`}
                      />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-2">
                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button
                        onClick={() => setShowResults(true)}
                        disabled={Object.keys(userAnswers).length !== questions.length}
                      >
                        Submit Practice
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Results */
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Practice Complete!</CardTitle>
                  <CardDescription>
                    Here's how you performed on this practice session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {Math.round((Object.values(userAnswers).filter((answer, index) => 
                      answer === questions[index]?.correct_answer
                    ).length / questions.length) * 100)}%
                  </div>
                  <p className="text-gray-600">
                    {Object.values(userAnswers).filter((answer, index) => 
                      answer === questions[index]?.correct_answer
                    ).length} out of {questions.length} correct
                  </p>
                  
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button
                      onClick={() => {
                        setShowResults(false);
                        setCurrentQuestionIndex(0);
                        setUserAnswers({});
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.history.back()}
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Question Review */}
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer === question.correct_answer;
                  
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span>Question {index + 1}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium mb-3">{question.question}</p>
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-2 rounded border ${
                                option === question.correct_answer 
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : option === userAnswer && !isCorrect
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {option}
                              {option === question.correct_answer && (
                                <span className="ml-2 text-sm font-medium">(Correct)</span>
                              )}
                              {option === userAnswer && !isCorrect && (
                                <span className="ml-2 text-sm font-medium">(Your answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice;
