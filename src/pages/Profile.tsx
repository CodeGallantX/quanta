
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, GraduationCap, Calendar, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  class: string;
  created_at: string;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  averageScore: number;
  subjects: {
    physics: number;
    chemistry: number;
  };
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProgressStats>({
    totalLessons: 0,
    completedLessons: 0,
    averageScore: 0,
    subjects: { physics: 0, chemistry: 0 }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', class: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setEditForm({ full_name: data.full_name, class: data.class });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get total lessons count
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, subject_id');

      // Get user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id, score')
        .eq('user_id', user.id);

      const totalLessons = lessonsData?.length || 0;
      const completedLessons = progressData?.length || 0;
      
      const averageScore = progressData && progressData.length > 0
        ? Math.round(progressData.reduce((sum, p) => sum + (p.score || 0), 0) / progressData.length)
        : 0;

      // Count completed lessons by subject
      const physicsCompleted = progressData?.filter(p => p.lesson_id.startsWith('physics')).length || 0;
      const chemistryCompleted = progressData?.filter(p => p.lesson_id.startsWith('chemistry')).length || 0;

      setStats({
        totalLessons,
        completedLessons,
        averageScore,
        subjects: {
          physics: physicsCompleted,
          chemistry: chemistryCompleted
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          class: editForm.class
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600">Unable to load your profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information and view your learning progress</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your personal details and account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditing ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-gray-600">Full Name</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{profile.email}</p>
                        <p className="text-sm text-gray-600">Email Address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{profile.class}</p>
                        <p className="text-sm text-gray-600">Class</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Member Since</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button onClick={() => setIsEditing(true)} className="w-full">
                        Edit Profile
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="class">Class</Label>
                      <Input
                        id="class"
                        value={editForm.class}
                        onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email (Read-only)</Label>
                      <Input id="email" value={profile.email} disabled />
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({ full_name: profile.full_name, class: profile.class });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Learning Statistics
                </CardTitle>
                <CardDescription>Your progress and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {completionPercentage}%
                  </div>
                  <p className="text-gray-600">Overall Progress</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.completedLessons} of {stats.totalLessons} lessons completed
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Score</span>
                    <Badge className={stats.averageScore >= 80 ? 'bg-green-100 text-green-800' : 
                                   stats.averageScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                   'bg-red-100 text-red-800'}>
                      {stats.averageScore}%
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Physics Lessons</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {stats.subjects.physics} completed
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Chemistry Lessons</span>
                    <Badge className="bg-green-100 text-green-800">
                      {stats.subjects.chemistry} completed
                    </Badge>
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.completedLessons >= 1 && (
                      <Badge className="bg-purple-100 text-purple-800">First Lesson</Badge>
                    )}
                    {stats.averageScore >= 90 && (
                      <Badge className="bg-yellow-100 text-yellow-800">High Achiever</Badge>
                    )}
                    {stats.subjects.physics >= 2 && (
                      <Badge className="bg-blue-100 text-blue-800">Physics Master</Badge>
                    )}
                    {stats.subjects.chemistry >= 2 && (
                      <Badge className="bg-green-100 text-green-800">Chemistry Expert</Badge>
                    )}
                    {completionPercentage === 100 && (
                      <Badge className="bg-gold-100 text-gold-800">Course Complete</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Debug Info (for development) */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
              <CardDescription className="text-xs">For development purposes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 font-mono">User ID: {user?.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
