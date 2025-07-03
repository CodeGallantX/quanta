
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/AdminLayout';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  newSignupsThisWeek: number;
  averageScore: number;
}

const AdminDashboard = () => {
  const { adminUser } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    newSignupsThisWeek: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total students
      const { count: totalStudents } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total courses
      const { count: totalCourses } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });

      // Fetch new signups this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: newSignupsThisWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Fetch average score
      const { data: results } = await supabase
        .from('results')
        .select('score, total');

      let averageScore = 0;
      if (results && results.length > 0) {
        const totalScore = results.reduce((sum, result) => sum + (result.score / result.total) * 100, 0);
        averageScore = Math.round(totalScore / results.length);
      }

      setStats({
        totalStudents: totalStudents || 0,
        totalCourses: totalCourses || 0,
        newSignupsThisWeek: newSignupsThisWeek || 0,
        averageScore
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Registered students',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      description: 'Available subjects',
      icon: BookOpen,
      color: 'text-emerald-600'
    },
    {
      title: 'New Signups',
      value: stats.newSignupsThisWeek,
      description: 'This week',
      icon: GraduationCap,
      color: 'text-purple-600'
    },
    {
      title: 'Average Score',
      value: `${stats.averageScore}%`,
      description: 'Student performance',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {adminUser?.full_name || 'Admin'}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your learning platform today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <Card key={card.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <p className="text-xs text-gray-500">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest student activities and system updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">New student registered: Physics Grade 11</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Lesson completed: Chemistry Basics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">High score achieved: 95% in Physics</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Add New Course
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Create New Lesson
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  View Student Reports
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  Manage Practice Questions
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
