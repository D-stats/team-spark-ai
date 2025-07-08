import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, Slack, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function OrganizationPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();
  const t = await getTranslations('organization');

  // Access control - only admins and managers
  if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('accessDenied')}
          </p>
        </div>
      </div>
    );
  }

  // Get organization information
  const organization = await prisma.organization.findUnique({
    where: { id: dbUser.organizationId },
    include: {
      _count: {
        select: {
          users: true,
          teams: true,
          surveys: true,
        },
      },
      slackWorkspaces: true,
    },
  });

  if (!organization) {
    throw new Error(t('organizationNotFound'));
  }

  const stats = [
    {
      label: t('stats.members'),
      value: organization._count.users,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: t('stats.teams'),
      value: organization._count.teams,
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: t('stats.surveys'),
      value: organization._count.surveys,
      icon: Calendar,
      color: 'text-purple-600',
    },
  ];

  const hasSlackIntegration = organization.slackWorkspaces.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>{t('info.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('info.name')}</p>
                <p className="text-lg font-medium">{organization.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('info.id')}</p>
                <p className="font-mono text-lg text-muted-foreground">{organization.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('info.createdAt')}</p>
                <p className="text-lg">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('info.plan')}</p>
                <Badge variant="default">{t('planTypes.standard')}</Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center space-x-3">
                    <div className={cn('rounded-lg bg-muted p-2', stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {dbUser.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Slack className="h-5 w-5" />
                  <CardTitle>{t('slack.title')}</CardTitle>
                </div>
                {hasSlackIntegration && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {t('slack.connected')}
                  </Badge>
                )}
              </div>
              <CardDescription>{t('slack.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hasSlackIntegration ? (
                  <>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="mb-1 text-sm font-medium">{t('slack.connectedWorkspace')}</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.slackWorkspaces[0]?.teamName ?? t('slack.unknownWorkspace')}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/settings/slack">
                        {t('slack.manageSettings')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t('slack.benefits')}
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {t('slack.features.kudosCommand')}</li>
                      <li>• {t('slack.features.notifications')}</li>
                      <li>• {t('slack.features.checkinReminders')}</li>
                      <li>• {t('slack.features.surveyNotifications')}</li>
                    </ul>
                    <Button asChild>
                      <Link href="/dashboard/settings/slack">
                        {t('slack.connect')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
