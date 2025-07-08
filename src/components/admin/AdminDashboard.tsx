'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Building, Activity, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    totalTeams: number;
    activeUsers: number;
    recentActivities: Array<{
      id: string;
      loginAt: Date;
      success: boolean;
      user: {
        name: string;
        email: string;
      };
    }>;
  };
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const t = useTranslations('admin');

  const quickActions = [
    {
      title: t('quickActions.manageUsers'),
      description: t('quickActions.manageUsersDesc'),
      href: '/dashboard/admin/users',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: t('quickActions.manageTeams'),
      description: t('quickActions.manageTeamsDesc'),
      href: '/dashboard/admin/teams',
      icon: Building,
      color: 'bg-green-500'
    },
    {
      title: t('quickActions.organizationSettings'),
      description: t('quickActions.organizationSettingsDesc'),
      href: '/dashboard/admin/organization',
      icon: Shield,
      color: 'bg-purple-500'
    },
    {
      title: t('quickActions.auditTrail'),
      description: t('quickActions.auditTrailDesc'),
      href: '/dashboard/admin/audit',
      icon: Activity,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.totalUsersDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.activeUsers')}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.activeUsersDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalTeams')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.totalTeamsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.recentLogins')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.recentLoginsDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action) => (
          <Card key={action.href} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={action.href}>
                <Button className="w-full">{t('quickActions.openAction')}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{t('recentActivities.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivities.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('recentActivities.empty')}</p>
            ) : (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${activity.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-medium">{activity.user.name}</p>
                      <p className="text-sm text-gray-600">{activity.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.success ? 'default' : 'destructive'}>
                      {activity.success ? t('recentActivities.success') : t('recentActivities.failed')}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.loginAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}