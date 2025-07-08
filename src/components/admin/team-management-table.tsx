'use client';

/**
 * Team Management Table Component
 * TSA-46: Table for displaying and managing teams
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  MoreHorizontal,
  Edit,
  Shield,
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  Eye,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  managerId: string | null;
  manager: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  members: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatarUrl: string | null;
      isActive: boolean;
    };
  }>;
  _count: {
    members: number;
  };
}

interface TeamManagementTableProps {
  teams: Team[];
  currentUserId: string;
  canModify: boolean;
}

export function TeamManagementTable({ teams, canModify }: TeamManagementTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleTeamAction = async (teamId: string, action: string) => {
    if (!canModify) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(teamId);

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${action} team`);
      }

      toast({
        title: 'Success',
        description: `Team ${action} successfully.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} team`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleManagerChange = async (teamId: string, newManagerId: string | null) => {
    if (!canModify) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to change team managers.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(teamId);

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId: newManagerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update team manager');
      }

      toast({
        title: 'Manager updated',
        description: newManagerId
          ? 'Team manager assigned successfully.'
          : 'Team manager removed successfully.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team manager',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTeamActivity = (team: Team) => {
    const memberCount = team._count.members;
    if (memberCount > 10) return { level: 'High', color: 'bg-green-100 text-green-800' };
    if (memberCount > 5) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    if (memberCount > 0) return { level: 'Low', color: 'bg-orange-100 text-orange-800' };
    return { level: 'None', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const activity = getTeamActivity(team);

            return (
              <TableRow key={team.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{team.name}</div>
                    {team.description && (
                      <div className="line-clamp-1 text-sm text-muted-foreground">
                        {team.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {team.manager ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={team.manager.avatarUrl || undefined}
                          alt={team.manager.name}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(team.manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{team.manager.name}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No manager</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{team._count.members}</span>
                    {team.members.length > 0 && (
                      <div className="flex -space-x-1">
                        {team.members.slice(0, 3).map((member) => (
                          <Avatar
                            key={member.user.id}
                            className="h-6 w-6 border-2 border-background"
                          >
                            <AvatarImage
                              src={member.user.avatarUrl || undefined}
                              alt={member.user.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted">
                            <span className="text-xs text-muted-foreground">
                              +{team.members.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="secondary" className={activity.color}>
                      {activity.level}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {team._count.members} members
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {team.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={isLoading === team.id}
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/teams/${team.id}/analytics`)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      {canModify && (
                        <>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/admin/teams/${team.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit team
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/admin/teams/${team.id}/members`)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Manage members
                          </DropdownMenuItem>

                          {!team.manager ? (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/admin/teams/${team.id}/assign-manager`)
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Assign manager
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleManagerChange(team.id, null)}>
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove manager
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              handleTeamAction(team.id, team.isActive ? 'deactivate' : 'activate')
                            }
                            className={team.isActive ? 'text-orange-600' : 'text-green-600'}
                          >
                            {team.isActive ? (
                              <>
                                <UserMinus className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Users className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleTeamAction(team.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete team
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {teams.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No teams found. Create your first team to organize your organization members.
        </div>
      )}
    </div>
  );
}
