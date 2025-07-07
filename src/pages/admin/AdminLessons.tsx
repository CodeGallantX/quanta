
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, BookOpen, ArrowLeft, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Lesson {
  id: string;
  title: string;
  content: string;
  preview: string;
  order_num: number;
  subject_id: string;
  thumbnail_url: string;
  created_at: string;
  evaluation_questions: any;
}

interface Subject {
  id: string;
  name: string;
}

const AdminLessons = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
    preview: '',
    order_num: 1,
    thumbnail_url: ''
  });

  useEffect(() => {
    if (subjectId) {
      fetchSubject();
      fetchLessons();
    }
  }, [subjectId]);

  const fetchSubject = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('id', subjectId)
        .single();

      if (error) throw error;
      setSubject(data);
    } catch (error) {
      console.error('Error fetching subject:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subject details",
        variant: "destructive"
      });
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order_num', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLesson) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            content: formData.content,
            preview: formData.preview,
            order_num: formData.order_num,
            thumbnail_url: formData.thumbnail_url
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Lesson updated successfully"
        });
      } else {
        // Create new lesson
        const { error } = await supabase
          .from('lessons')
          .insert([{
            id: formData.id,
            title: formData.title,
            content: formData.content,
            preview: formData.preview,
            order_num: formData.order_num,
            subject_id: subjectId,
            thumbnail_url: formData.thumbnail_url,
            evaluation_questions: []
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Lesson created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingLesson(null);
      setFormData({ id: '', title: '', content: '', preview: '', order_num: 1, thumbnail_url: '' });
      fetchLessons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      preview: lesson.preview || '',
      order_num: lesson.order_num,
      thumbnail_url: lesson.thumbnail_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Lesson deleted successfully"
      });
      
      fetchLessons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const resetForm = () => {
    setFormData({ id: '', title: '', content: '', preview: '', order_num: lessons.length + 1, thumbnail_url: '' });
    setEditingLesson(null);
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lessons - {subject?.name}
              </h1>
              <p className="text-gray-600">Manage lessons for this subject</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                </DialogTitle>
                <DialogDescription>
                  {editingLesson ? 'Update the lesson details' : 'Create a new lesson with Markdown + LaTeX support'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="id">Lesson ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g., lesson-1, intro-to-physics"
                    disabled={!!editingLesson}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to Physics"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preview">Preview Text</Label>
                  <Textarea
                    id="preview"
                    value={formData.preview}
                    onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                    placeholder="Short preview of the lesson content..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="order_num">Order Number</Label>
                  <Input
                    id="order_num"
                    type="number"
                    value={formData.order_num}
                    onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) })}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Content (Markdown + LaTeX)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(formData.content)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="# Lesson Title

## Introduction
Write your lesson content here using **Markdown** and LaTeX math:

Inline math: $E = mc^2$

Block math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

- Bullet points
- **Bold text**
- *Italic text*"
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Content Preview</DialogTitle>
              <DialogDescription>
                Preview of how the content will be rendered
              </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {previewContent}
              </ReactMarkdown>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Lessons
            </CardTitle>
            <CardDescription>
              Manage all lessons for {subject?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Lesson ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>{lesson.order_num}</TableCell>
                    <TableCell className="font-mono text-sm">{lesson.id}</TableCell>
                    <TableCell className="font-medium">{lesson.title}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {lesson.preview || 'No preview'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(lesson.content)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lesson)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lesson.id)}
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

export default AdminLessons;
