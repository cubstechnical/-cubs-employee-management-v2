'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import {
  Home,
  Users,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  BarChart3,
  Palette,
  ClipboardList,
  Shield,
  UserPlus,
  LogOut,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

interface SidebarProps {
  onClose?: () => void;
}

function SidebarItem({ href, icon, children, isActive, onClose }: SidebarItemProps & { onClose?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out group',
        'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm',
        'transform hover:translate-x-1',
        isActive
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm'
          : 'text-gray-700 dark:text-gray-300'
      )}
    >
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        isActive
          ? 'text-primary-600 dark:text-primary-400 scale-110'
          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 group-hover:scale-110'
      )}>
        {icon}
      </div>
      <span className="font-medium transition-all duration-300">{children}</span>
    </Link>
  );
}

const adminItems = [
  { href: '/dashboard', icon: <BarChart3 className="w-5 h-5" />, label: 'Dashboard' },
  { href: '/employees', icon: <Users className="w-5 h-5" />, label: 'Employees' },
  { href: '/documents', icon: <FileText className="w-5 h-5" />, label: 'Documents' },
  { href: '/notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
  { href: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to sign out');
        return;
      }
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed ? (
          <Logo size="md" showText={true} />
        ) : (
          <Logo size="md" showText={false} />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'p-2 rounded-lg transition-all duration-300 ease-in-out',
            'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm',
            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            'transform hover:scale-110'
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 transition-transform duration-300" /> : <ChevronLeft className="w-4 h-4 transition-transform duration-300" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {adminItems.map((item, index) => (
          <div
            key={item.href}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SidebarItem
              href={item.href}
              icon={item.icon}
              isActive={pathname === item.href}
              onClose={onClose}
            >
              {!isCollapsed && item.label}
            </SidebarItem>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <ThemeToggle size="sm" />
        
        {/* User Info */}
        {user && !isCollapsed && (
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name || user.email}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user.role}
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out group hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm transform hover:translate-x-1 text-red-600 dark:text-red-400"
        >
          <div className="transition-all duration-300 ease-in-out text-red-600 dark:text-red-400 group-hover:scale-110">
            <LogOut className="w-5 h-5" />
          </div>
          {!isCollapsed && <span className="font-medium transition-all duration-300">Sign Out</span>}
        </button>
        
        {!isCollapsed && (
          <div className="text-center">
            <a
              href="https://chocosoftdev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              © 2024 ChocoSoft Dev
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
