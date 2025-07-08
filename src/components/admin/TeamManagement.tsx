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
import { Textarea } from '@/components/ui/textarea';
import { Building, Users, UserCheck, Plus, Search, MoreVertical, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
  members: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      role: 'ADMIN' | 'MANAGER' | 'MEMBER';
    };
  }>;
  _count: {
    members: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

interface TeamManagementProps {
  teams: Team[];
  users: User[];
}

export default function TeamManagement({ teams, users }: TeamManagementProps) {
  const t = useTranslations('admin.teams');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTeam = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: t('create.success'),
          description: t('create.successDesc')
        });
        setIsCreateDialogOpen(false);
        window.location.reload();
      } else {
        throw new Error('Failed to create team');
      }
    } catch (error) {
      toast({
        title: t('create.error'),
        description: t('create.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTeam = async (formData: FormData) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        toast({
          title: t('update.success'),
          description: t('update.successDesc')
        });
        setIsEditDialogOpen(false);
        setSelectedTeam(null);
        window.location.reload();
      } else {
        throw new Error('Failed to update team');
      }
    } catch (error) {
      toast({
        title: t('update.error'),
        description: t('update.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm(t('delete.confirm'))) return;

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: t('delete.success'),
          description: t('delete.successDesc')
        });
        window.location.reload();
      } else {
        throw new Error('Failed to delete team');
      }
    } catch (error) {
      toast({
        title: t('delete.error'),
        description: t('delete.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const availableManagers = users.filter(user => 
    user.role === 'ADMIN' || user.role === 'MANAGER'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.createTeam')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('create.title')}</DialogTitle>
            </DialogHeader>
            <form action={handleCreateTeam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('form.name')}</Label>
                  <Input type="text" id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="manager">{t('form.manager')}</Label>
                  <Select name="managerId">
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectManager')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableManagers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">{t('form.description')}</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="members">{t('form.members')}</Label>
                <Select name="memberIds">
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectMembers')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">{t('form.create')}</Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map(team => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>{team.name}</span>
                  </CardTitle>
                  {team.description && (
                    <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                  )}
                </div>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Manager */}
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {team.manager ? (
                    <div>
                      <p className="font-medium text-sm">{team.manager.name}</p>
                      <p className="text-xs text-gray-600">{team.manager.email}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">{t('team.noManager')}</span>
                  )}
                </div>

                {/* Members Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {t('team.members', { count: team._count.members })}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {team._count.members}
                  </Badge>
                </div>

                {/* Member List (first few) */}
                <div className="space-y-1">
                  {team.members.slice(0, 3).map(member => (
                    <div key={member.user.id} className="flex items-center space-x-2">
                      <UserCheck className="h-3 w-3 text-green-500" />
                      <span className="text-xs">{member.user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.user.role}
                      </Badge>
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <p className="text-xs text-gray-500">
                      {t('team.moreMembers', { count: team.members.length - 3 })}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(team);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    {t('actions.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    {t('actions.delete')}
                  </Button>
                </div>

                {/* Created Date */}
                <p className="text-xs text-gray-500">
                  {t('team.created')}: {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit.title')}</DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <form action={handleUpdateTeam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">{t('form.name')}</Label>
                  <Input 
                    type="text" 
                    id="editName" 
                    name="name" 
                    defaultValue={selectedTeam.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="editManager">{t('form.manager')}</Label>
                  <Select name="managerId" defaultValue={selectedTeam.manager?.id || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectManager')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('form.noManager')}</SelectItem>
                      {availableManagers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editDescription">{t('form.description')}</Label>
                <Textarea 
                  id="editDescription" 
                  name="description" 
                  defaultValue={selectedTeam.description || ''}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">{t('form.update')}</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedTeam(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('empty.message')}</p>
            <Button 
              className="mt-4" 
              onClick={() => setIsCreateDialogOpen(true)}
            >
              {t('empty.createFirst')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}