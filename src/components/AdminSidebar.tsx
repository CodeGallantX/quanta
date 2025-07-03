
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const menuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Courses', url: '/admin/courses', icon: BookOpen },
  { title: 'Lessons', url: '/admin/lessons', icon: FileText },
  { title: 'Evaluations', url: '/admin/evaluations', icon: HelpCircle },
  { title: 'Practice Questions', url: '/admin/practice-questions', icon: HelpCircle },
  { title: 'Students', url: '/admin/students', icon: Users },
  { title: 'Results', url: '/admin/results', icon: BarChart3 },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { collapsed } = useSidebar();
  const { adminUser, signOut } = useAdminAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-emerald-100 text-emerald-700 font-medium' : 'hover:bg-emerald-50';

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out of the admin panel."
    });
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible
    >
      <SidebarContent className="bg-white border-r border-emerald-200">
        <div className="p-4 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-emerald-700">Quanta Admin</h2>
                <p className="text-xs text-gray-500">Content Management</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-emerald-600">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-emerald-200">
          {!collapsed && adminUser && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700">{adminUser.full_name}</p>
              <p className="text-xs text-gray-500">{adminUser.role}</p>
            </div>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full justify-start border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
