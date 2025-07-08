
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Home,
  Atom,
  Zap,
  Brain,
  User,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Physics', href: '/dashboard/physics', icon: Zap },
    { name: 'Chemistry', href: '/dashboard/chemistry', icon: Atom },
    { name: 'Yoruba', href: '/dashboard/YOR102', icon: Atom },
    { name: 'Practice', href: '/dashboard/practice', icon: Brain },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-6">
        <div className="w-20">
          <img src="/quanta.png" alt="quanta logo" className="w-full h-full object-cover" />
        </div>
        <p className="text-sm text-gray-600 mt-1">Welcome, {user?.user_metadata?.full_name || 'Student'}!</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="sm"
          className="bg-white shadow-md"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
