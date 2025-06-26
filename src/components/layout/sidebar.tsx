'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n/utils';
import {
  LayoutDashboard,
  Heart,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  Building2,
  Target,
} from 'lucide-react';

interface NavigationItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'okr', href: '/okrs', icon: Target },
  { key: 'kudos', href: '/dashboard/kudos', icon: Heart },
  { key: 'checkins', href: '/dashboard/checkins', icon: CheckSquare },
  { key: 'surveys', href: '/dashboard/surveys', icon: BarChart3 },
  { key: 'teams', href: '/dashboard/teams', icon: Users },
  { key: 'organization', href: '/dashboard/organization', icon: Building2 },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">TS</span>
          </div>
          <span className="text-xl font-semibold">TeamSpark AI</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          // For dashboard, check exact match only
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-gray-700 hover:bg-gray-100',
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
