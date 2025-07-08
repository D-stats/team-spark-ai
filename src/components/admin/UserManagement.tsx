'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Download, Upload, Search, MoreVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  isActive: boolean;
  createdAt: Date;
  lastActiveAt: Date | null;
  teamMemberships: Array<{
    team: {
      id: string;
      name: string;
    };
  }>;
  managedTeams: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    teamMemberships: number;
    managedTeams: number;
  };
}

interface Team {
  id: string;
  name: string;
}

interface UserManagementProps {
  users: User[];
  teams: Team[];
}

export default function UserManagement({ users, teams }: UserManagementProps) {
  const t = useTranslations('admin.users');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInviteUser = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: t('invite.success'),
          description: t('invite.successDesc')
        });
        setIsInviteDialogOpen(false);
        window.location.reload();
      } else {
        throw new Error('Failed to invite user');
      }
    } catch (error) {
      toast({
        title: t('invite.error'),
        description: t('invite.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      });

      if (response.ok) {
        toast({
          title: t('bulk.success'),
          description: t('bulk.successDesc')
        });
        setSelectedUsers([]);
        window.location.reload();
      } else {
        throw new Error('Failed to perform bulk action');
      }
    } catch (error) {
      toast({
        title: t('bulk.error'),
        description: t('bulk.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: t('export.success'),
        description: t('export.successDesc')
      });
    } catch (error) {
      toast({
        title: t('export.error'),
        description: t('export.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'MEMBER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allRoles')}</SelectItem>
              <SelectItem value="ADMIN">{t('filters.admin')}</SelectItem>
              <SelectItem value="MANAGER">{t('filters.manager')}</SelectItem>
              <SelectItem value="MEMBER">{t('filters.member')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
              <SelectItem value="active">{t('filters.active')}</SelectItem>
              <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleExportUsers} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('actions.export')}
          </Button>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {t('actions.bulkImport')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('bulk.title')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">{t('bulk.csvFile')}</Label>
                  <Input type="file" accept=".csv" id="csvFile" />
                </div>
                <Button onClick={() => setIsBulkDialogOpen(false)}>
                  {t('bulk.upload')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('actions.inviteUser')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('invite.title')}</DialogTitle>
              </DialogHeader>
              <form action={handleInviteUser} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('invite.email')}</Label>
                  <Input type="email" id="email" name="email" required />
                </div>
                <div>
                  <Label htmlFor="name">{t('invite.name')}</Label>
                  <Input type="text" id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="role">{t('invite.role')}</Label>
                  <Select name="role" defaultValue="MEMBER">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                      <SelectItem value="MANAGER">{t('roles.manager')}</SelectItem>
                      <SelectItem value="MEMBER">{t('roles.member')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teams">{t('invite.teams')}</Label>
                  <Select name="teams">
                    <SelectTrigger>
                      <SelectValue placeholder={t('invite.selectTeam')} />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">{t('invite.send')}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t('bulk.selected', { count: selectedUsers.length })}
              </span>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleBulkAction('activate')}>
                  {t('bulk.activate')}
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('deactivate')}>
                  {t('bulk.deactivate')}
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('delete')} variant="destructive">
                  {t('bulk.delete')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{t('table.title')} ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {t(`roles.${user.role.toLowerCase()}`)}
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="secondary">{t('status.inactive')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {t('table.teams')}: {user._count.teamMemberships}
                      </span>
                      {user._count.managedTeams > 0 && (
                        <span className="text-xs text-gray-500">
                          {t('table.managing')}: {user._count.managedTeams}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {t('table.joined')}: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    {t('actions.edit')}
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}