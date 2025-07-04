import { getTranslations } from 'next-intl/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/settings/profile-form';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { PasswordSettings } from '@/components/settings/password-settings';
import { SessionManagement } from '@/components/settings/session-management';
import { SlackUserSettings } from '@/components/settings/slack-user-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SettingsPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();
  const t = await getTranslations('settings');

  // Get user detailed information
  const userWithDetails = await prisma.user.findUnique({
    where: { id: dbUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      skills: true,
      timezone: true,
      locale: true,
      phoneNumber: true,
      linkedinUrl: true,
      githubUrl: true,
      twitterUrl: true,
      twoFactorEnabled: true,
      lastPasswordChange: true,
      emailNotifications: true,
      kudosNotifications: true,
      checkinReminders: true,
      surveyNotifications: true,
      teamUpdates: true,
      digestFrequency: true,
      isActive: true,
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  // Check Slack workspace integration status
  const slackWorkspace = await prisma.slackWorkspace.findFirst({
    where: {
      organizationId: dbUser.organizationId,
    },
  });

  if (!userWithDetails) {
    throw new Error('User information not found');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('tabs.sessions')}</TabsTrigger>
          {slackWorkspace && <TabsTrigger value="slack">{t('tabs.slack')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={userWithDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.title')}</CardTitle>
              <CardDescription>{t('notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings user={userWithDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <PasswordSettings user={userWithDetails} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionManagement />
        </TabsContent>

        {slackWorkspace && (
          <TabsContent value="slack">
            <Card>
              <CardHeader>
                <CardTitle>{t('slack.title')}</CardTitle>
                <CardDescription>{t('slack.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <SlackUserSettings user={userWithDetails} slackWorkspace={slackWorkspace} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
