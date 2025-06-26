import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { CreateTeamDialog } from '@/components/teams/create-team-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function TeamsPage() {
  const { dbUser } = await requireAuthWithOrganization();
  const t = await getTranslations('teams.manage');

  // 組織のチームを取得
  const teams = await prisma.team.findMany({
    where: {
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
            },
          },
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

  // 組織内のすべてのユーザーを取得（チーム作成時に使用）
  const allUsers = await prisma.user.findMany({
    where: {
      organizationId: dbUser.organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
    },
  });

  const isAdmin = dbUser.role === 'ADMIN';
  const isManager = dbUser.role === 'MANAGER' || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>
        {isManager && <CreateTeamDialog users={allUsers} />}
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">{t('empty.title')}</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {t('empty.description')}
              <br />
              {isManager ? t('empty.managerAction') : t('empty.memberAction')}
            </p>
            {isManager && <CreateTeamDialog users={allUsers} />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-4 w-4" />
                      {team._count.members}
                    </div>
                  </div>
                  {team.description && <CardDescription>{team.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                        {t('memberCount', { count: team._count.members }).split(' ')[1]}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {team.members.slice(0, 6).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-1 rounded bg-muted px-2 py-1 text-xs"
                            title={`${member.user.name} (${member.user.email})`}
                          >
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-xs">
                              {member.user.name.charAt(0)}
                            </div>
                            <span className="max-w-20 truncate">{member.user.name}</span>
                          </div>
                        ))}
                        {team.members.length > 6 && (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            {t('moreMembers', { count: team.members.length - 6 })}
                          </div>
                        )}
                      </div>
                    </div>
                    {isManager && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          {t('actions.edit')}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          {t('actions.details')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
