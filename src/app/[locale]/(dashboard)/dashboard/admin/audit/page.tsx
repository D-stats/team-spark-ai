/**
 * Admin Audit Logs Page
 * TSA-46: Audit trail and activity logging for admin actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Shield, Settings, AlertTriangle } from 'lucide-react';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { canAccessAuditLogs } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import { formatDistanceToNow } from 'date-fns';

async function AuditLogsList({ organizationId }: { organizationId: string }) {
  // Get recent audit logs for the organization
  const auditLogs = await prisma.auditLog.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Show last 50 entries
  });

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return User;
    if (action.includes('admin') || action.includes('role')) return Shield;
    if (action.includes('settings') || action.includes('organization')) return Settings;
    return Activity;
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'bg-red-100 text-red-800';
    if (action.includes('delete') || action.includes('deactivate')) return 'bg-orange-100 text-orange-800';
    if (action.includes('create') || action.includes('invite')) return 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('modify')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {auditLogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4">No audit logs found.</p>
            <p className="text-sm">Admin actions will appear here once they occur.</p>
          </CardContent>
        </Card>
      ) : (
        auditLogs.map((log) => {
          const ActionIcon = getActionIcon(log.action);
          return (
            <Card key={log.id}>
              <CardContent className="py-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ActionIcon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{log.user?.name || 'System'}</span>
                        <Badge
                          variant="secondary"
                          className={getActionColor(log.action, log.success)}
                        >
                          {log.action}
                        </Badge>
                        {!log.success && (
                          <Badge variant="destructive" className="text-xs">
                            Failed
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">
                        {log.errorMessage ? (
                          `Error: ${log.errorMessage}`
                        ) : log.newValues ? (
                          `Updated: ${JSON.stringify(log.newValues).substring(0, 100)}...`
                        ) : (
                          'Action completed successfully'
                        )}
                      </p>
                      {log.entityType && log.entityId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: {log.entityType} ({log.entityId})
                        </p>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

async function AuditStats({ organizationId }: { organizationId: string }) {
  // Get audit statistics
  const [
    totalLogs,
    todayLogs,
    failedActions,
    uniqueUsers
  ] = await Promise.all([
    prisma.auditLog.count({ where: { organizationId } }),
    prisma.auditLog.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.auditLog.count({
      where: { organizationId, success: false }
    }),
    prisma.auditLog.findMany({
      where: { organizationId },
      select: { userId: true },
      distinct: ['userId'],
    }).then(results => results.length)
  ]);

  const stats = [
    {
      title: 'Total Actions',
      value: totalLogs,
      icon: Activity,
      description: 'All recorded actions',
      color: 'text-blue-600',
    },
    {
      title: 'Today\'s Activity',
      value: todayLogs,
      icon: Activity,
      description: 'Actions in last 24h',
      color: 'text-green-600',
    },
    {
      title: 'Failed Actions',
      value: failedActions,
      icon: AlertTriangle,
      description: 'Actions that failed',
      color: 'text-red-600',
    },
    {
      title: 'Active Admins',
      value: uniqueUsers,
      icon: Shield,
      description: 'Users with logged actions',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

export default async function AdminAuditPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // Check if user has access to audit logs
  if (!canAccessAuditLogs(dbUser)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View all administrative actions and system events for your organization.
        </p>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <AuditStats organizationId={dbUser.organizationId} />
      </Suspense>

      {/* Audit Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <div className="p-6">
              <AuditLogsList organizationId={dbUser.organizationId} />
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}