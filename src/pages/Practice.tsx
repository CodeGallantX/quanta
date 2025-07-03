
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, X, RefreshCw, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  subject_id: string;
}

const Practice = () => {
  const { subjectId } = useParams<{ subjectId?: string }>();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [selectedSubject, setSelectedSubject] = useState(subjectId || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedDifficulty]);

  const fetchQuestions = async () => {
    try {
      let query = supabase.from('practice_questions').select('*');
      
      if (selectedSubject !== 'all') {
        query = query.eq('subject_id', selectedSubject);
      }
      
      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty', selectedDifficulty);
      }

      const { data } = await query;
      setQuestions(data || []);
      
      if (data && data.length > 0) {
        const randomQuestion = data[Math.floor(Math.random() * data.length)];
        setCurrentQuestion(randomQuestion);
      } else {
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load practice questions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showAnswer) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    setShowAnswer(true);
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      toast({
        title: "Correct! 🎉",
        description: "Well done!",
      });
    } else {
      toast({
        title: "Not quite right",
        description: "Check the explanation below.",
        variant: "destructive"
      });
    }
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setSelectedAnswer('');
    setShowAnswer(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject: string) => {
    return subject === 'physics' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Brain className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Practice Questions</h1>
            </div>
            
            {/* Score Display */}
            {score.total > 0 && (
              <div className="bg-white rounded-lg p-4 mb-6 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-700">
                      Score: {score.correct}/{score.total}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({Math.round((score.correct / score.total) * 100)}% accuracy)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScore({ correct: 0, total: 0 })}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Question Card */}
          {currentQuestion ? (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                      {currentQuestion.difficulty}
                    </Badge>
                    <Badge className={getSubjectColor(currentQuestion.subject_id)}>
                      {currentQuestion.subject_id}
                    </Badge>
                    {currentQuestion.topic && (
                      <Badge variant="outline">{currentQuestion.topic}</Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuestion.options.map((option, index) => {
                  let optionClass = 'p-4 border rounded-lg cursor-pointer transition-colors ';
                  
                  if (showAnswer) {
                    if (option === currentQuestion.correct_answer) {
                      optionClass += 'border-green-500 bg-green-50 text-green-800';
                    } else if (option === selectedAnswer && option !== currentQuestion.correct_answer) {
                      optionClass += 'border-red-500 bg-red-50 text-red-800';
                    } else {
                      optionClass += 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed';
                    }
                  } else {
                    if (selectedAnswer === option) {
                      optionClass += 'border-indigo-500 bg-indigo-50';
                    } else {
                      optionClass += 'border-gray-200 hover:border-gray-300';
                    }
                  }

                  return (
                    <div
                      key={index}
                      className={optionClass}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showAnswer && (
                          <>
                            {option === currentQuestion.correct_answer && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {option === selectedAnswer && option !== currentQuestion.correct_answer && (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {showAnswer && currentQuestion.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                    <p className="text-blue-800">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="pt-4">
                  {!showAnswer ? (
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="w-full"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNextQuestion}
                      className="w-full"
                    >
                      Next Question
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or check back later for new questions.
                </p>
                <Button variant="outline" onClick={fetchQuestions}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice;
