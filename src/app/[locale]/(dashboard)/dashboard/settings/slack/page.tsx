import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { getSlackAuthUrl } from '@/lib/slack/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slack, Check, AlertCircle } from 'lucide-react';

export default async function SlackSettingsPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // 管理者のみアクセス可能
  if (dbUser.role !== 'ADMIN') {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Slack連携の設定は管理者のみが行えます。</AlertDescription>
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
        <h1 className="text-3xl font-bold">Slack連携設定</h1>
        <p className="mt-2 text-muted-foreground">SlackワークスペースとTeamSpark AIを連携します</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Slack className="h-6 w-6" />
              <CardTitle>ワークスペース連携</CardTitle>
            </div>
            {slackWorkspace && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="mr-1 h-3 w-3" />
                連携済み
              </Badge>
            )}
          </div>
          <CardDescription>
            SlackワークスペースとTeamSpark
            AIを連携することで、Slack上から直接Kudosの送信や通知の受信ができるようになります。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!slackConfigured ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Slack連携機能は現在設定されていません。システム管理者にお問い合わせください。
              </AlertDescription>
            </Alert>
          ) : slackWorkspace ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">連携済みワークスペース</h4>
                <p className="text-sm text-muted-foreground">チーム名: {slackWorkspace.teamName}</p>
                <p className="text-sm text-muted-foreground">チームID: {slackWorkspace.teamId}</p>
                <p className="text-sm text-muted-foreground">
                  連携日: {new Date(slackWorkspace.installedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">利用可能な機能</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✅ /kudos コマンドでKudosを送信</li>
                  <li>✅ Kudos受信時のSlack通知</li>
                  <li>✅ チェックインリマインダー</li>
                  <li>✅ サーベイ開始通知</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <Button variant="outline" asChild>
                  <a href={slackAuthUrl!}>
                    <Slack className="mr-2 h-4 w-4" />
                    連携を更新
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">連携するとできること</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Slack上から /kudos コマンドでKudosを送信</li>
                  <li>• Kudosを受け取った時にSlackで通知</li>
                  <li>• 週次チェックインのリマインダー通知</li>
                  <li>• サーベイ開始・締切の通知</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  連携にはSlackワークスペースの管理者権限が必要です。
                  連携後、チームメンバーがSlackアカウントとTeamSpark
                  AIアカウントを紐付ける必要があります。
                </AlertDescription>
              </Alert>

              <Button asChild>
                <a href={slackAuthUrl!}>
                  <Slack className="mr-2 h-4 w-4" />
                  Slackと連携する
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {slackWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>Slackコマンドの使い方</CardTitle>
            <CardDescription>Slack上で利用できるコマンドの一覧です</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <p className="mb-1 font-semibold">/kudos @ユーザー名 カテゴリ メッセージ</p>
                <p className="text-xs text-muted-foreground">
                  例: /kudos @tanaka teamwork 素晴らしいプレゼンテーションでした！
                </p>
              </div>

              <div className="text-sm">
                <p className="mb-2 font-medium">カテゴリ一覧:</p>
                <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <li>• teamwork - チームワーク</li>
                  <li>• innovation - イノベーション</li>
                  <li>• leadership - リーダーシップ</li>
                  <li>• problem_solving - 問題解決</li>
                  <li>• customer_focus - 顧客志向</li>
                  <li>• learning - 学習・成長</li>
                  <li>• other - その他</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
