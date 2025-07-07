
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Shield, BookOpen } from 'lucide-react';
import bcrypt from 'bcryptjs';

const AdminSignup = () => {
  const { adminUser, loading: authLoading } = useAdminAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If admin is already logged in, redirect to dashboard
  if (adminUser && !authLoading) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

      // Insert the new admin user
      const { error } = await supabase
        .from('admin_users')
        .insert([{
          email: formData.email,
          password_hash: hashedPassword,
          full_name: formData.fullName,
          role: formData.role
        }]);

      if (error) {
        console.error('Signup error:', error);
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "An admin with this email already exists",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create admin account",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Admin account created successfully! You can now log in.",
        });
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">Quanta Admin</h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" />
            Educational Content Management System
          </p>
        </div>
        
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-700">Admin Sign Up</CardTitle>
            <CardDescription>Create a new administrative account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@quanta.edu"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter a secure password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700" 
                disabled={loading || authLoading}
              >
                {loading ? 'Creating Account...' : 'Create Admin Account'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an admin account?{' '}
                <Link to="/admin/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign in here
                </Link>
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="text-xs mt-2"
              >
                Go to Student Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignup;
