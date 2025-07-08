'use client';

/**
 * User Management Table Component
 * TSA-46: Table for displaying and managing users
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
import { MoreHorizontal, Edit, Shield, UserX, UserCheck, Mail, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: Date | null;
  avatarUrl: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  teamMemberships: Array<{
    team: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    sentKudos: number;
    receivedKudos: number;
  };
}

interface UserManagementTableProps {
  users: User[];
  currentUserId: string;
  canModify: boolean;
}

export function UserManagementTable({ users, currentUserId, canModify }: UserManagementTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const roleColors = {
    ADMIN: 'bg-red-100 text-red-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    MEMBER: 'bg-green-100 text-green-800',
  };

  const handleUserAction = async (userId: string, action: string) => {
    if (!canModify) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${action} user`);
      }

      toast({
        title: 'Success',
        description: `User ${action} successfully.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} user`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!canModify) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to change user roles.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }

      toast({
        title: 'Role updated',
        description: `User role changed to ${newRole}.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user role',
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={roleColors[user.role as keyof typeof roleColors]}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {user.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      Inactive
                    </Badge>
                  )}
                  {!user.emailVerified && (
                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                      Pending
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.teamMemberships.length > 0 ? (
                    user.teamMemberships.slice(0, 2).map((teamMember) => (
                      <Badge key={teamMember.team.id} variant="outline" className="text-xs">
                        {teamMember.team.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No teams</span>
                  )}
                  {user.teamMemberships.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.teamMemberships.length - 2} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>
                    Kudos: {user._count.sentKudos}/{user._count.receivedKudos}
                  </div>
                  <div className="text-muted-foreground">Active user</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </div>
                {user.lastActiveAt && (
                  <div className="text-xs text-muted-foreground">
                    Last: {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={isLoading === user.id}
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                      Copy email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {canModify && user.id !== currentUserId && (
                      <>
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit profile
                        </DropdownMenuItem>

                        {!user.emailVerified && (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, 'resend-invite')}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend invite
                          </DropdownMenuItem>
                        )}

                        {user.role !== 'ADMIN' && (
                          <>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'ADMIN')}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'MANAGER')}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'MEMBER')}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make member
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />

                        {user.isActive ? (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, 'deactivate')}
                            className="text-orange-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, 'activate')}
                            className="text-green-600"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete user
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {users.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No users found. Start by inviting team members to your organization.
        </div>
      )}
    </div>
  );
}
