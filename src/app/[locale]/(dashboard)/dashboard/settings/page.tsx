import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { EnhancedProfileForm } from '@/components/settings/enhanced-profile-form';
import { AccountSettings } from '@/components/settings/account-settings';
import { EnhancedNotificationSettings } from '@/components/settings/enhanced-notification-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { SlackUserSettings } from '@/components/settings/slack-user-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();
  const t = await getTranslations('settings');

  // Get user details with all necessary fields
  const userWithDetails = await prisma.user.findUnique({
    where: { id: dbUser.id },
    include: {
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
        <p className="mt-2 text-muted-foreground">
          Manage your profile, account settings, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="account">{t('tabs.account')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
          {slackWorkspace && <TabsTrigger value="slack">{t('tabs.slack')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <EnhancedProfileForm />
        </TabsContent>

        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <EnhancedNotificationSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        {slackWorkspace && (
          <TabsContent value="slack">
            <SlackUserSettings user={userWithDetails} slackWorkspace={slackWorkspace} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
