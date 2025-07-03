
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in (stored in localStorage)
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (error) {
        console.error('Error parsing stored admin user:', error);
        localStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // For demo purposes, we'll use a simple check
      // In production, you'd want to implement proper password hashing verification
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin credentials:', error);
        return { error: new Error('Authentication failed') };
      }

      if (!adminData) {
        return { error: new Error('Invalid credentials') };
      }

      // For demo purposes, we'll accept any password for existing admin users
      // In production, you'd verify the password hash here
      console.log('Admin user found:', adminData.email);
      
      setAdminUser(adminData);
      localStorage.setItem('adminUser', JSON.stringify(adminData));
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: new Error('Authentication failed') };
    }
  };

  const signOut = async () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  return (
    <AdminAuthContext.Provider value={{
      adminUser,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
