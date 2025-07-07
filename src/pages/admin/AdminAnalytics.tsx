
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, BookOpen, Target } from 'lucide-react';

interface AnalyticsData {
  subjectScores: Array<{ subject: string; average: number; attempts: number }>;
  completionRates: Array<{ subject: string; completed: number; total: number; rate: number }>;
  attemptsOverTime: Array<{ date: string; attempts: number }>;
  difficultyDistribution: Array<{ difficulty: string; count: number }>;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    subjectScores: [],
    completionRates: [],
    attemptsOverTime: [],
    difficultyDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch subject scores
      const { data: subjectScores } = await supabase
        .from('results')
        .select(`
          score,
          total,
          subject_id,
          subjects (name)
        `);

      // Fetch completion rates
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          lesson_id,
          lessons (subject_id, subjects (name))
        `);

      // Fetch attempts over time
      const { data: attemptsData } = await supabase
        .from('results')
        .select('attempt_date')
        .order('attempt_date', { ascending: true });

      // Fetch difficulty distribution
      const { data: difficultyData } = await supabase
        .from('practice_questions')
        .select('difficulty');

      // Process subject scores
      const scoresBySubject = subjectScores?.reduce((acc: any, result: any) => {
        const subjectName = result.subjects?.name || result.subject_id;
        if (!acc[subjectName]) {
          acc[subjectName] = { totalScore: 0, totalPossible: 0, attempts: 0 };
        }
        acc[subjectName].totalScore += result.score;
        acc[subjectName].totalPossible += result.total;
        acc[subjectName].attempts += 1;
        return acc;
      }, {});

      const processedSubjectScores = Object.entries(scoresBySubject || {}).map(([subject, data]: [string, any]) => ({
        subject,
        average: Math.round((data.totalScore / data.totalPossible) * 100),
        attempts: data.attempts
      }));

      // Process completion rates
      const completionBySubject = progressData?.reduce((acc: any, progress: any) => {
        const subjectName = progress.lessons?.subjects?.name || 'Unknown';
        if (!acc[subjectName]) {
          acc[subjectName] = { completed: 0, total: 0 };
        }
        acc[subjectName].completed += 1;
        return acc;
      }, {});

      // Get total lessons per subject
      const { data: totalLessons } = await supabase
        .from('lessons')
        .select(`
          subject_id,
          subjects (name)
        `);

      const lessonsBySubject = totalLessons?.reduce((acc: any, lesson: any) => {
        const subjectName = lesson.subjects?.name || lesson.subject_id;
        acc[subjectName] = (acc[subjectName] || 0) + 1;
        return acc;
      }, {});

      const processedCompletionRates = Object.entries(lessonsBySubject || {}).map(([subject, total]: [string, any]) => {
        const completed = completionBySubject?.[subject]?.completed || 0;
        return {
          subject,
          completed,
          total,
          rate: Math.round((completed / total) * 100)
        };
      });

      // Process attempts over time
      const attemptsByDate = attemptsData?.reduce((acc: any, attempt: any) => {
        const date = new Date(attempt.attempt_date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const processedAttemptsOverTime = Object.entries(attemptsByDate || {})
        .map(([date, attempts]: [string, any]) => ({ date, attempts }))
        .slice(-30); // Last 30 days

      // Process difficulty distribution
      const difficultyCount = difficultyData?.reduce((acc: any, question: any) => {
        acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
        return acc;
      }, {});

      const processedDifficultyDistribution = Object.entries(difficultyCount || {}).map(([difficulty, count]: [string, any]) => ({
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        count
      }));

      setAnalytics({
        subjectScores: processedSubjectScores,
        completionRates: processedCompletionRates,
        attemptsOverTime: processedAttemptsOverTime,
        difficultyDistribution: processedDifficultyDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

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
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Insights into student performance and engagement</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.subjectScores.reduce((sum, subject) => sum + subject.attempts, 0)}
              </div>
              <p className="text-xs text-gray-500">Across all subjects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.subjectScores.length > 0 
                  ? Math.round(analytics.subjectScores.reduce((sum, subject) => sum + subject.average, 0) / analytics.subjectScores.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500">Overall performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.completionRates.length > 0
                  ? Math.round(analytics.completionRates.reduce((sum, subject) => sum + subject.rate, 0) / analytics.completionRates.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500">Lesson completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Practice Questions</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.difficultyDistribution.reduce((sum, item) => sum + item.count, 0)}
              </div>
              <p className="text-xs text-gray-500">Total questions</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Average Scores by Subject</CardTitle>
              <CardDescription>Performance across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.subjectScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Question Difficulty Distribution</CardTitle>
              <CardDescription>Breakdown of practice questions by difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.difficultyDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ difficulty, count }) => `${difficulty}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.difficultyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Attempts Over Time</CardTitle>
              <CardDescription>Daily quiz attempts (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.attemptsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="attempts" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lesson Completion Rates</CardTitle>
              <CardDescription>Completion progress by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.completionRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
