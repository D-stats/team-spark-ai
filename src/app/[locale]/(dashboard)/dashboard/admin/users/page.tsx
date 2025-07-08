/**
 * User Management Admin Page
 * TSA-46: User management interface for administrators
 */

import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { canAccessUserManagement } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { UserInviteForm } from '@/components/admin/user-invite-form';

export default async function AdminUsersPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // Check permissions
  if (!canAccessUserManagement(dbUser)) {
    redirect('/dashboard');
  }

  // Fetch users with detailed information
  const users = await prisma.user.findMany({
    where: { organizationId: dbUser.organizationId },
    include: {
      teamMemberships: {
        select: {
          team: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: {
          sentKudos: true,
          receivedKudos: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch organization for context
  const organization = await prisma.organization.findUnique({
    where: { id: dbUser.organizationId },
    select: {
      maxUsers: true,
      planType: true,
    },
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  // const inactiveUsers = totalUsers - activeUsers;
  const adminUsers = users.filter((u) => u.role === 'ADMIN').length;
  const pendingInvites = users.filter((u) => !u.emailVerified).length;

  const usagePercentage = organization?.maxUsers
    ? Math.round((activeUsers / organization.maxUsers) * 100)
    : 0;

  // const roleColors = {
  //   ADMIN: 'bg-red-100 text-red-800',
  //   MANAGER: 'bg-blue-100 text-blue-800',
  //   MEMBER: 'bg-green-100 text-green-800'
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage users, roles, and permissions for your organization
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* User Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            {organization?.maxUsers && (
              <p className="text-xs text-muted-foreground">
                {usagePercentage}% of {organization.maxUsers} limit
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Users with admin privileges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites}</div>
            <p className="text-xs text-muted-foreground">Awaiting email verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Actions</CardTitle>
          <CardDescription>Bulk operations and user management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex min-w-[300px] flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users by name, email, or role..." className="flex-1" />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Bulk Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite New User
            </CardTitle>
            <CardDescription>Send an invitation to join your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <UserInviteForm organizationId={dbUser.organizationId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest user management activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">John Doe</span> was promoted to Manager
                <span className="text-muted-foreground"> • 2 hours ago</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">jane@example.com</span> invitation sent
                <span className="text-muted-foreground"> • 5 hours ago</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Mike Wilson</span> account deactivated
                <span className="text-muted-foreground"> • 1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTable
            users={users}
            currentUserId={dbUser.id}
            canModify={dbUser.role === 'ADMIN'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
