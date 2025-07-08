/**
 * Admin Dashboard Page
 * TSA-46: Main admin panel with organization overview and metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Building, Shield, Activity, AlertTriangle } from 'lucide-react';
import { getUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { canAccessAdminPanel } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';

async function AdminStatsCards({ organizationId }: { organizationId: string }) {
  // Get organization stats
  const [totalUsers, activeUsers, totalTeams, activeTeams, recentLogins, pendingInvitations] =
    await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.user.count({ where: { organizationId, isActive: true } }),
      prisma.team.count({ where: { organizationId } }),
      prisma.team.count({ where: { organizationId, isActive: true } }),
      prisma.loginHistory.count({
        where: {
          user: { organizationId },
          success: true,
          loginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      }),
      prisma.userInvitation.count({
        where: { organizationId, status: 'PENDING' },
      }),
    ]);

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      description: `${activeUsers} active`,
      color: 'text-blue-600',
    },
    {
      title: 'Active Teams',
      value: activeTeams,
      icon: Building,
      description: `${totalTeams} total`,
      color: 'text-green-600',
    },
    {
      title: 'Recent Logins',
      value: recentLogins,
      icon: UserCheck,
      description: 'Last 24 hours',
      color: 'text-purple-600',
    },
    {
      title: 'Pending Invitations',
      value: pendingInvitations,
      icon: AlertTriangle,
      description: 'Awaiting response',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function RecentActivity({ organizationId }: { organizationId: string }) {
  // Get recent audit logs
  const recentLogs = await prisma.auditLog.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">
                    {log.user?.name || 'System'} {log.action.toLowerCase()}d a{' '}
                    {log.entityType.toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                <div
                  className={`rounded-full px-2 py-1 text-xs ${
                    log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {log.success ? 'Success' : 'Failed'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function QuickActions() {
  const actions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/dashboard/admin/users',
      icon: Users,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Team Management',
      description: 'Create and manage teams',
      href: '/dashboard/admin/teams',
      icon: Building,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Organization Settings',
      description: 'Configure organization settings',
      href: '/dashboard/admin/organization',
      icon: Shield,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Audit Logs',
      description: 'View activity and audit trails',
      href: '/dashboard/admin/audit',
      icon: Activity,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.title}
                href={action.href}
                className={`${action.color} block rounded-lg p-4 text-white transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6" />
                  <div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Convert to RBAC user format for permission checking
  const rbacUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organizationId,
    role: user.role as any, // Type assertion for Role enum
    isActive: true, // User is authenticated, so active
  };

  // Check admin access
  if (!canAccessAdminPanel(rbacUser)) {
    redirect('/dashboard?error=access-denied');
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization, users, and teams</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium">Administrator</span>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="h-4 animate-pulse rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="mb-2 h-8 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <AdminStatsCards organizationId={user.organizationId} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <RecentActivity organizationId={user.organizationId} />
        </Suspense>
      </div>

    </div>
  );
}
