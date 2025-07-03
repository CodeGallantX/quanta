
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

const Practice = () => {
  const { subjectId } = useParams();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    fetchQuestions();
  }, [subjectId]);

  const fetchQuestions = async () => {
    try {
      const targetSubject = subjectId || 'physics';
      
      const { data, error } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('subject_id', targetSubject)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to handle the Json type from Supabase
      const questionsData: PracticeQuestion[] = (data || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : []
      }));
      
      setQuestions(questionsData);
      if (questionsData.length > 0) {
        setCurrentQuestion(questionsData[Math.floor(Math.random() * questionsData.length)]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load practice questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    setShowAnswer(true);
    
    if (isCorrect) {
      toast.success('Correct! Well done!');
    } else {
      toast.error('Incorrect. Check the explanation below.');
    }
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setSelectedAnswer('');
    setShowAnswer(false);
  };

  const getSubjectName = () => {
    if (subjectId === 'physics') return 'Physics';
    if (subjectId === 'chemistry') return 'Chemistry';
    return 'Mixed Practice';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (questions.length === 0) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No practice questions available</h2>
            <p className="text-gray-600">Check back later for more questions!</p>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getSubjectName()} Practice</h1>
                <p className="text-gray-600 mt-1">Test your knowledge with practice questions</p>
              </div>
              
              {/* Score Display */}
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">
                  {score.correct}/{score.total} correct
                </div>
              </div>
            </div>

            {currentQuestion && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Practice Question</CardTitle>
                    <div className="flex gap-2">
                      {currentQuestion.topic && (
                        <Badge variant="outline">{currentQuestion.topic}</Badge>
                      )}
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty || 'Medium'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={showAnswer}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                          showAnswer
                            ? option === currentQuestion.correct_answer
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : option === selectedAnswer && option !== currentQuestion.correct_answer
                              ? 'border-red-500 bg-red-50 text-red-800'
                              : 'border-gray-200 bg-gray-50'
                            : selectedAnswer === option
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showAnswer && (
                            <>
                              {option === currentQuestion.correct_answer && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              {option === selectedAnswer && option !== currentQuestion.correct_answer && (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {showAnswer && currentQuestion.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                      <p className="text-blue-800">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handleNextQuestion}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      New Question
                    </Button>
                    
                    {!showAnswer ? (
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedAnswer}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Next Question
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{questions.length}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{score.correct}</div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{score.total}</div>
                  <div className="text-sm text-gray-600">Questions Attempted</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
