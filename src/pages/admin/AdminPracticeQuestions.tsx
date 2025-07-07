
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Upload, HelpCircle } from 'lucide-react';
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
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

const AdminPracticeQuestions = () => {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    topic: '',
    difficulty: 'medium',
    subject_id: ''
  });

  useEffect(() => {
    fetchSubjects();
    fetchQuestions();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_questions')
        .select(`
          *,
          subjects (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch practice questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.options.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "All options must be filled",
        variant: "destructive"
      });
      return;
    }

    if (!formData.options.includes(formData.correct_answer)) {
      toast({
        title: "Error",
        description: "Correct answer must be one of the options",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('practice_questions')
          .update({
            question: formData.question,
            options: formData.options,
            correct_answer: formData.correct_answer,
            explanation: formData.explanation,
            topic: formData.topic,
            difficulty: formData.difficulty,
            subject_id: formData.subject_id
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Question updated successfully"
        });
      } else {
        // Create new question
        const { error } = await supabase
          .from('practice_questions')
          .insert([{
            question: formData.question,
            options: formData.options,
            correct_answer: formData.correct_answer,
            explanation: formData.explanation,
            topic: formData.topic,
            difficulty: formData.difficulty,
            subject_id: formData.subject_id
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Question created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleJsonUpload = async () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('JSON must be an array of questions');
      }

      const questionsToInsert = parsedData.map(item => ({
        question: item.question,
        options: item.options,
        correct_answer: item.correct_answer,
        explanation: item.explanation || '',
        topic: item.topic || '',
        difficulty: item.difficulty || 'medium',
        subject_id: item.subject_id
      }));

      const { error } = await supabase
        .from('practice_questions')
        .insert(questionsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${questionsToInsert.length} questions uploaded successfully`
      });

      setJsonInput('');
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Invalid JSON format',
        variant: "destructive"
      });
    }
  };

  const handleEdit = (question: PracticeQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      topic: question.topic || '',
      difficulty: question.difficulty || 'medium',
      subject_id: question.subject_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('practice_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Question deleted successfully"
      });
      
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      topic: '',
      difficulty: 'medium',
      subject_id: ''
    });
    setEditingQuestion(null);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const jsonExample = `[
  {
    "question": "What is the formula for kinetic energy?",
    "options": ["KE = 1/2 mv²", "KE = mgh", "KE = mc²", "KE = Fd"],
    "correct_answer": "KE = 1/2 mv²",
    "explanation": "Kinetic energy is the energy of motion, calculated as half the mass times velocity squared.",
    "topic": "Energy",
    "difficulty": "medium",
    "subject_id": "physics"
  }
]`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Practice Questions</h1>
            <p className="text-gray-600">Manage practice questions for all subjects</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </DialogTitle>
                <DialogDescription>
                  Create or modify practice questions for students
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Question Form</TabsTrigger>
                  <TabsTrigger value="json">JSON Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="space-y-4">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="subject_id">Subject</Label>
                      <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="question">Question</Label>
                      <Textarea
                        id="question"
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="Enter the question..."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Options</Label>
                      {formData.options.map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="mt-2"
                          required
                        />
                      ))}
                    </div>
                    
                    <div>
                      <Label htmlFor="correct_answer">Correct Answer</Label>
                      <Select value={formData.correct_answer} onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.options.map((option, index) => (
                            <SelectItem key={index} value={option} disabled={!option.trim()}>
                              {option || `Option ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="explanation">Explanation</Label>
                      <Textarea
                        id="explanation"
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="topic">Topic</Label>
                        <Input
                          id="topic"
                          value={formData.topic}
                          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                          placeholder="e.g., Mechanics, Algebra"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                      {editingQuestion ? 'Update Question' : 'Create Question'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="json" className="space-y-4">
                  <div>
                    <Label htmlFor="json-input">JSON Data</Label>
                    <Textarea
                      id="json-input"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Paste your JSON data here..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Example JSON format:</p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                      {jsonExample}
                    </pre>
                  </div>
                  
                  <Button onClick={handleJsonUpload} className="bg-emerald-600 hover:bg-emerald-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Questions
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              All Practice Questions
            </CardTitle>
            <CardDescription>
              Manage practice questions across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-xs truncate">{question.question}</TableCell>
                    <TableCell>{question.subject_id}</TableCell>
                    <TableCell>{question.topic || 'General'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {question.difficulty}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{question.correct_answer}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPracticeQuestions;
