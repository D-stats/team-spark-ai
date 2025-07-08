import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  Settings, 
  UserPlus, 
  ArrowLeft, 
  Crown,
  Mail,
  Shield,
  MapPin,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface TeamDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // Fetch team with detailed information
  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      organizationId: dbUser.organizationId,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              isActive: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
      parentTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      childTeams: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          objectives: true,
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const isAdmin = dbUser.role === 'ADMIN';
  const isTeamManager = team.managerId === dbUser.id;
  const canManageTeam = isAdmin || isTeamManager;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/teams">
              <ArrowLeft className="h-4 w-4" />
              Back to Teams
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            {team.description !== null && team.description !== '' && (
              <p className="mt-2 text-muted-foreground">{team.description}</p>
            )}
          </div>
        </div>
        {canManageTeam && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Members
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Manage Team
            </Button>
          </div>
        )}
      </div>

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team._count.members}</div>
            <p className="text-xs text-muted-foreground">
              {team.maxMembers !== null && team.maxMembers > 0 ? `${team.maxMembers} max capacity` : 'No limit set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Type</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.teamType}</div>
            <p className="text-xs text-muted-foreground">
              {team.isActive ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectives</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team._count.objectives}</div>
            <p className="text-xs text-muted-foreground">Active objectives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(team.createdAt).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor((new Date().getTime() - new Date(team.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({team._count.members})
            </CardTitle>
            <CardDescription>
              Current members of this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {member.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.user.name}</span>
                        {member.userId === team.managerId && (
                          <Badge variant="secondary">
                            <Crown className="mr-1 h-3 w-3" />
                            Manager
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">
                      <Shield className="mr-1 h-3 w-3" />
                      {member.user.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Details and hierarchy information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Manager */}
            {team.manager && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Team Manager</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {team.manager.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{team.manager.name}</div>
                    <div className="text-sm text-muted-foreground">{team.manager.email}</div>
                  </div>
                  <Badge variant="secondary">
                    <Crown className="mr-1 h-3 w-3" />
                    {team.manager.role}
                  </Badge>
                </div>
              </div>
            )}

            {/* Parent Team */}
            {team.parentTeam && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Parent Team</h4>
                <div className="p-3 rounded-lg border">
                  <Link
                    href={`/dashboard/teams/${team.parentTeam.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {team.parentTeam.name}
                  </Link>
                </div>
              </div>
            )}

            {/* Child Teams */}
            {team.childTeams.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Sub Teams ({team.childTeams.length})</h4>
                <div className="space-y-2">
                  {team.childTeams.map((childTeam) => (
                    <div key={childTeam.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <Link
                        href={`/dashboard/teams/${childTeam.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {childTeam.name}
                      </Link>
                      <Badge variant="outline">
                        {childTeam._count.members} members
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Team Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={team.isActive ? "default" : "secondary"}>
                {team.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type</span>
              <Badge variant="outline">{team.teamType}</Badge>
            </div>

            {team.maxMembers !== null && team.maxMembers > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Capacity</span>
                <span className="text-sm text-muted-foreground">
                  {team._count.members} / {team.maxMembers}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}