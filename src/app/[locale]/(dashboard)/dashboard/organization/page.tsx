import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, Slack, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function OrganizationPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // 管理者のみアクセス可能
  if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">組織設定</h1>
          <p className="mt-2 text-muted-foreground">
            組織設定の閲覧・変更は管理者またはマネージャーのみ可能です。
          </p>
        </div>
      </div>
    );
  }

  // 組織情報を取得
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
    throw new Error('組織情報が見つかりません');
  }

  const stats = [
    {
      label: 'メンバー数',
      value: organization._count.users,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'チーム数',
      value: organization._count.teams,
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: 'サーベイ数',
      value: organization._count.surveys,
      icon: Calendar,
      color: 'text-purple-600',
    },
  ];

  const hasSlackIntegration = organization.slackWorkspaces.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">組織設定</h1>
        <p className="mt-2 text-muted-foreground">
          組織の基本情報と設定を管理します
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>組織情報</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">組織名</p>
                <p className="text-lg font-medium">{organization.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">組織ID</p>
                <p className="text-lg font-mono text-muted-foreground">{organization.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">作成日</p>
                <p className="text-lg">{new Date(organization.createdAt).toLocaleDateString('ja-JP')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">プラン</p>
                <Badge variant="default">スタンダード</Badge>
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
                  <CardTitle>Slack連携</CardTitle>
                </div>
                {hasSlackIntegration && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    連携済み
                  </Badge>
                )}
              </div>
              <CardDescription>
                SlackワークスペースとTeamSpark AIを連携します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hasSlackIntegration ? (
                  <>
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium mb-1">連携済みワークスペース</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.slackWorkspaces[0].teamName}
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/settings/slack">
                        Slack設定を管理
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Slackと連携することで、以下の機能が利用できます：
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• /kudos コマンドでKudosを送信</li>
                      <li>• Kudos受信時のSlack通知</li>
                      <li>• チェックインリマインダー</li>
                      <li>• サーベイ通知</li>
                    </ul>
                    <Button asChild>
                      <Link href="/dashboard/settings/slack">
                        Slackと連携する
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