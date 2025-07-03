
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  description: string;
  grade: string;
  thumbnail_url: string;
  created_at: string;
}

const AdminCourses = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    grade: 'Grade 11',
    thumbnail_url: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        // Update existing subject
        const { error } = await supabase
          .from('subjects')
          .update({
            name: formData.name,
            description: formData.description,
            grade: formData.grade,
            thumbnail_url: formData.thumbnail_url
          })
          .eq('id', editingSubject.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Course updated successfully"
        });
      } else {
        // Create new subject
        const { error } = await supabase
          .from('subjects')
          .insert([{
            id: formData.id,
            name: formData.name,
            description: formData.description,
            grade: formData.grade,
            thumbnail_url: formData.thumbnail_url
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Course created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingSubject(null);
      setFormData({ id: '', name: '', description: '', grade: 'Grade 11', thumbnail_url: '' });
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      id: subject.id,
      name: subject.name,
      description: subject.description || '',
      grade: subject.grade || 'Grade 11',
      thumbnail_url: subject.thumbnail_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Course deleted successfully"
      });
      
      fetchSubjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', description: '', grade: 'Grade 11', thumbnail_url: '' });
    setEditingSubject(null);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage subjects and courses across different grades</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Edit Course' : 'Add New Course'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject ? 'Update the course details' : 'Create a new course for students'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="id">Course ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g., physics, chemistry"
                    disabled={!!editingSubject}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Physics, Chemistry"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description..."
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g., Grade 11"
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
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingSubject ? 'Update Course' : 'Create Course'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Courses
            </CardTitle>
            <CardDescription>
              Manage all subjects and courses available to students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-mono text-sm">{subject.id}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.grade}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {subject.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subject.id)}
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

export default AdminCourses;
