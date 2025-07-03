
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, Atom, Zap } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_num: number;
  subject_id: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
}

const SubjectLessons = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!subjectId) return;

      try {
        // Fetch subject info
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', subjectId)
          .single();

        // Fetch lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('subject_id', subjectId)
          .order('order_num');

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user?.id);

        setSubject(subjectData);
        setLessons(lessonsData || []);
        setCompletedLessons(progressData?.map(p => p.lesson_id) || []);
      } catch (error) {
        console.error('Error fetching subject data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [subjectId, user]);

  const getSubjectIcon = () => {
    return subjectId === 'physics' ? Zap : Atom;
  };

  const getSubjectColors = () => {
    return subjectId === 'physics' 
      ? { primary: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
      : { primary: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Subject Not Found</h1>
            <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-500">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const Icon = getSubjectIcon();
  const colors = getSubjectColors();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Subject Header */}
          <div className={`${colors.bg} ${colors.border} border rounded-lg p-6 mb-8`}>
            <div className="flex items-center mb-4">
              <Icon className={`h-8 w-8 ${colors.primary} mr-3`} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
                <p className="text-gray-600 mt-1">{subject.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {completedLessons.length} of {lessons.length} lessons completed
              </Badge>
              <Link 
                to={`/dashboard/${subjectId}/practice`}
                className={`text-sm ${colors.primary} hover:underline font-medium`}
              >
                Practice Questions →
              </Link>
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lessons</h2>
            {lessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              
              return (
                <Link key={lesson.id} to={`/dashboard/${subjectId}/lesson/${lesson.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                            <p className="text-sm text-gray-600">
                              Lesson {lesson.order_num}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCompleted ? (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Start
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {lessons.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons available</h3>
                <p className="text-gray-600">Check back soon for new content!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectLessons;
