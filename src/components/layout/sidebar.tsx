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
  Shield,
  UserCog,
  GitBranch,
  Activity,
} from 'lucide-react';

interface NavigationItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface SidebarProps {
  user?: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    role: string;
    avatarUrl?: string;
  };
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

const adminNavigationItems: NavigationItem[] = [
  { key: 'adminDashboard', href: '/dashboard/admin', icon: Shield, adminOnly: true },
  { key: 'userManagement', href: '/dashboard/admin/users', icon: UserCog, adminOnly: true },
  { key: 'teamManagement', href: '/dashboard/admin/teams', icon: GitBranch, adminOnly: true },
  { key: 'organizationManagement', href: '/dashboard/admin/organization', icon: Building2, adminOnly: true },
  { key: 'auditTrail', href: '/dashboard/admin/audit', icon: Activity, adminOnly: true },
];

export function Sidebar({ user }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] ?? 'en';
  
  const isAdmin = user?.role === 'ADMIN';

  const renderNavigationSection = (items: NavigationItem[], sectionTitle?: string) => (
    <div className="space-y-1">
      {sectionTitle && (
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {sectionTitle}
          </h3>
        </div>
      )}
      {items.map((item) => {
        // Add locale prefix to href
        const localizedHref = `/${currentLocale}${item.href}`;

        // For dashboard, check exact match only
        const isActive =
          item.href === '/dashboard'
            ? pathname === localizedHref
            : pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
        return (
          <Link
            key={item.key}
            href={localizedHref}
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
    </div>
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${currentLocale}/dashboard`} className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">TS</span>
          </div>
          <span className="text-xl font-semibold">TeamSpark AI</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Main Navigation */}
          {renderNavigationSection(navigationItems)}
          
          {/* Admin Navigation - only show for admins */}
          {isAdmin && (
            <>
              <div className="border-t pt-4">
                {renderNavigationSection(adminNavigationItems, t('admin'))}
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
