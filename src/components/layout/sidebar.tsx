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
  Activity,
} from 'lucide-react';
import { getAccessibleAdminNavigation } from '@/lib/auth/admin-middleware';
import { AuthUser } from '@/lib/auth/rbac';
import { Separator } from '@/components/ui/separator';

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

interface SidebarProps {
  user?: AuthUser;
}

export function Sidebar({ user }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  // Extract current locale from pathname
  const currentLocale = pathname.split('/')[1] ?? 'en';

  // Get accessible admin navigation for the user
  const adminNavItems = user ? getAccessibleAdminNavigation(user) : [];

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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Main Navigation */}
        {navigationItems.map((item) => {
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

        {/* Admin Navigation - Only show if user has admin access */}
        {adminNavItems.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="px-3 py-2">
              <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Shield className="mr-2 h-3 w-3" />
                Administration
              </div>
            </div>
            {adminNavItems.map((item) => {
              const localizedHref = `/${currentLocale}${item.href}`;
              
              // Improved active state logic to prevent multiple items being active
              const isActive = (() => {
                // Exact match for all admin routes
                if (pathname === localizedHref) return true;
                
                // For non-admin dashboard routes, check if current path starts with the item href
                // but only if it's not the admin dashboard itself
                if (item.href !== '/dashboard/admin' && pathname.startsWith(`${localizedHref}/`)) {
                  // Make sure we don't activate parent routes when on child routes
                  const remainingPath = pathname.slice(localizedHref.length);
                  // Only activate if there's exactly one more path segment (direct child)
                  return remainingPath.split('/').filter(Boolean).length <= 1;
                }
                
                return false;
              })();

              // Map icons
              const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                dashboard: LayoutDashboard,
                users: UserCog,
                teams: Users,
                organization: Building2,
                audit: Activity,
              };

              const Icon = iconMap[item.icon as string] || Shield;

              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-l-2 border-red-500 bg-red-100 text-red-900'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-800',
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}
