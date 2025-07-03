
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Atom, Zap, BookOpen, Trophy } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
}

interface UserProgress {
  lesson_id: string;
  score: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subjects
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .order('name');

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, score')
          .eq('user_id', user?.id);

        setSubjects(subjectsData || []);
        setProgress(progressData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getSubjectIcon = (subjectId: string) => {
    return subjectId === 'physics' ? Zap : Atom;
  };

  const getProgressPercentage = () => {
    // Simple calculation: assume 4 lessons total (2 per subject)
    const totalLessons = 4;
    const completedLessons = progress.length;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
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
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.user_metadata?.full_name || 'Student'}! 👋
            </h1>
            <p className="text-gray-600">Ready to continue your learning journey?</p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-teal-50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-700">
                <Trophy className="mr-2 h-5 w-5" />
                Your Learning Progress
              </CardTitle>
              <CardDescription>Track your journey through Physics and Chemistry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Progress value={getProgressPercentage()} className="flex-1" />
                <span className="text-sm font-medium text-gray-700">
                  {getProgressPercentage()}% Complete
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {progress.length} of 4 lessons completed
              </p>
            </CardContent>
          </Card>

          {/* Subjects Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {subjects.map((subject) => {
              const Icon = getSubjectIcon(subject.id);
              const subjectProgress = progress.filter(p => p.lesson_id.startsWith(subject.id));
              
              return (
                <Link key={subject.id} to={`/dashboard/${subject.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Icon className={`mr-3 h-6 w-6 ${
                          subject.id === 'physics' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                        {subject.name}
                      </CardTitle>
                      <CardDescription>{subject.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {subjectProgress.length} lessons completed
                        </span>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          subject.id === 'physics' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {subject.name}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/dashboard/physics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-blue-900">Physics Lessons</h3>
                  <p className="text-sm text-blue-700">Explore motion and forces</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/dashboard/chemistry">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <Atom className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-green-900">Chemistry Lessons</h3>
                  <p className="text-sm text-green-700">Understand atoms and reactions</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/dashboard/practice">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-purple-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium text-purple-900">Practice Questions</h3>
                  <p className="text-sm text-purple-700">Test your knowledge</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
