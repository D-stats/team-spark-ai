import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/settings/profile-form';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { SlackUserSettings } from '@/components/settings/slack-user-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SettingsPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // ユーザーの詳細情報を取得
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

  // Slackワークスペースの連携状態を確認
  const slackWorkspace = await prisma.slackWorkspace.findFirst({
    where: {
      organizationId: dbUser.organizationId,
    },
  });

  if (!userWithDetails) {
    throw new Error('ユーザー情報が見つかりません');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">個人設定</h1>
        <p className="mt-2 text-muted-foreground">プロフィールや通知設定を管理します</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="notifications">通知設定</TabsTrigger>
          {slackWorkspace && <TabsTrigger value="slack">Slack連携</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール情報</CardTitle>
              <CardDescription>あなたの基本情報を更新します</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={userWithDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>受信したい通知の種類を設定します</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings user={userWithDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        {slackWorkspace && (
          <TabsContent value="slack">
            <Card>
              <CardHeader>
                <CardTitle>Slack連携設定</CardTitle>
                <CardDescription>
                  SlackアカウントとTeamSpark AIアカウントを連携します
                </CardDescription>
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
