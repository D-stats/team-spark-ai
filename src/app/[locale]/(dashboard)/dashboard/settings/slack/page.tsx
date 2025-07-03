import { getTranslations } from 'next-intl/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { getSlackAuthUrl } from '@/lib/slack/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slack, Check, AlertCircle } from 'lucide-react';

export default async function SlackSettingsPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();
  const t = await getTranslations('slackSettings');

  // 管理者のみアクセス可能
  if (dbUser.role !== 'ADMIN') {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('adminOnlyMessage')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 既存のSlack連携を確認
  const slackWorkspace = await prisma.slackWorkspace.findFirst({
    where: {
      organizationId: dbUser.organizationId,
    },
  });

  // Slack認証URLを生成（Slackが設定されている場合のみ）
  let slackAuthUrl: string | null = null;
  let slackConfigured = true;
  try {
    slackAuthUrl = getSlackAuthUrl(dbUser.organizationId);
  } catch (error) {
    slackConfigured = false;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Slack className="h-6 w-6" />
              <CardTitle>{t('workspaceIntegration')}</CardTitle>
            </div>
            {slackWorkspace && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="mr-1 h-3 w-3" />
                {t('connected')}
              </Badge>
            )}
          </div>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!slackConfigured ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('notConfiguredMessage')}</AlertDescription>
            </Alert>
          ) : slackWorkspace ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">{t('connectedWorkspaceTitle')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('teamNameLabel')}: {slackWorkspace.teamName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('teamIdLabel')}: {slackWorkspace.teamId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('connectedDateLabel')}:{' '}
                  {new Date(slackWorkspace.installedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('availableFeaturesTitle')}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>{t('featureKudos')}</li>
                  <li>{t('featureNotifications')}</li>
                  <li>{t('featureReminders')}</li>
                  <li>{t('featureSurveyNotifications')}</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <Button variant="outline" asChild>
                  <a href={slackAuthUrl ?? '#'}>
                    <Slack className="mr-2 h-4 w-4" />
                    {t('updateConnectionButton')}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">{t('benefitsTitle')}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>{t('benefitSlackKudos')}</li>
                  <li>{t('benefitSlackNotifications')}</li>
                  <li>{t('benefitCheckInReminders')}</li>
                  <li>{t('benefitSurveyNotifications')}</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('requirementsMessage')}</AlertDescription>
              </Alert>

              {slackAuthUrl !== null && slackAuthUrl !== '' && (
                <Button asChild>
                  <a href={slackAuthUrl}>
                    <Slack className="mr-2 h-4 w-4" />
                    {t('connectButton')}
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {slackWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>{t('commandsTitle')}</CardTitle>
            <CardDescription>{t('commandsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <p className="mb-1 font-semibold">{t('kudosCommandSyntax')}</p>
                <p className="text-xs text-muted-foreground">{t('kudosCommandExample')}</p>
              </div>

              <div className="text-sm">
                <p className="mb-2 font-medium">{t('categoriesTitle')}</p>
                <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <li>{t('categoryTeamwork')}</li>
                  <li>{t('categoryInnovation')}</li>
                  <li>{t('categoryLeadership')}</li>
                  <li>{t('categoryProblemSolving')}</li>
                  <li>{t('categoryCustomerFocus')}</li>
                  <li>{t('categoryLearning')}</li>
                  <li>{t('categoryOther')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
