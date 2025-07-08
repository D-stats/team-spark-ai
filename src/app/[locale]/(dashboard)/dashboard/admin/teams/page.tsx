/**
 * Team Management Admin Page
 * TSA-46: Team management interface for administrators
 */

import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { canAccessTeamManagement } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Shield,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { TeamManagementTable } from '@/components/admin/team-management-table';
import { CreateTeamForm } from '@/components/admin/create-team-form';

export default async function AdminTeamsPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // Check permissions
  if (!canAccessTeamManagement(dbUser)) {
    redirect('/dashboard');
  }

  // Fetch teams with detailed information
  const teams = await prisma.team.findMany({
    where: { organizationId: dbUser.organizationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate statistics
  const totalTeams = teams.length;
  const activeTeams = teams.filter((t) => t.isActive).length;
  const totalMembers = teams.reduce((sum, team) => sum + team._count.members, 0);
  const averageTeamSize = totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;
  const teamsWithManagers = teams.filter((t) => t.managerId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Users className="h-8 w-8" />
            Team Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organize users into teams and manage team structures
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Team Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground">{activeTeams} active teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Avg {averageTeamSize} per team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Managers</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamsWithManagers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((teamsWithManagers / totalTeams) * 100 || 0)}% have managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((activeTeams / totalTeams) * 100 || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">Teams active</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Actions</CardTitle>
          <CardDescription>Bulk operations and team management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex min-w-[300px] flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams by name, description, or manager..."
                className="flex-1"
              />
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
              <Calendar className="h-4 w-4" />
              Team Calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Team
            </CardTitle>
            <CardDescription>Set up a new team structure for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTeamForm organizationId={dbUser.organizationId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Team Insights
            </CardTitle>
            <CardDescription>Analytics and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Most Active Team</span>
                <Badge variant="secondary">
                  {teams.sort((a, b) => b._count.members - a._count.members)[0]?.name || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Largest Team</span>
                <Badge variant="outline">
                  {teams.sort((a, b) => b._count.members - a._count.members)[0]?.name || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Newest Team</span>
                <Badge variant="outline">
                  {teams.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                  )[0]?.name || 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>Complete overview of teams in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamManagementTable
            teams={teams}
            currentUserId={dbUser.id}
            canModify={dbUser.role === 'ADMIN'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
