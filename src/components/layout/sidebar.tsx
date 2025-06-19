'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Heart, 
  CheckSquare, 
  BarChart3, 
  Users, 
  Settings,
  Building2,
  Target
} from 'lucide-react';

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
  { name: 'OKR', href: '/okrs', icon: Target },
  { name: 'Kudos', href: '/dashboard/kudos', icon: Heart },
  { name: 'チェックイン', href: '/dashboard/checkins', icon: CheckSquare },
  { name: 'サーベイ', href: '/dashboard/surveys', icon: BarChart3 },
  { name: 'チーム', href: '/dashboard/teams', icon: Users },
  { name: '組織設定', href: '/dashboard/organization', icon: Building2 },
  { name: '個人設定', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">HR</span>
          </div>
          <span className="text-xl font-semibold">Startup HR</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}