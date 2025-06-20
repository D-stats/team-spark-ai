import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { TemplateBasedCheckIn } from '@/components/checkins/template-based-checkin';
import { CheckInHistory } from '@/components/checkins/checkin-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { CreateDefaultTemplateButton } from '@/components/checkins/create-default-template-button';

export default async function CheckInsPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // デフォルトテンプレートを取得（存在しない場合は作成を促す）
  const defaultTemplate = await prisma.checkInTemplate.findFirst({
    where: {
      organizationId: dbUser.organizationId,
      isDefault: true,
      isActive: true,
    },
  });

  // 過去のチェックイン履歴を取得
  const checkInHistory = await prisma.checkIn.findMany({
    where: {
      userId: dbUser.id,
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          frequency: true,
          questions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">チェックイン</h1>
          <p className="mt-2 text-muted-foreground">
            カスタマイズされたテンプレートで定期的な振り返りを記録しましょう
          </p>
        </div>
        {dbUser.role === 'ADMIN' && (
          <Link href="/dashboard/checkins/templates">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              テンプレート管理
            </Button>
          </Link>
        )}
      </div>

      {!defaultTemplate ? (
        <Card>
          <CardHeader>
            <CardTitle>テンプレートが設定されていません</CardTitle>
            <CardDescription>
              チェックインを開始するには、まず管理者がテンプレートを作成する必要があります
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbUser.role === 'ADMIN' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  組織の最初のチェックインテンプレートを作成してください。
                  デフォルトテンプレートから始めるか、カスタムテンプレートを作成できます。
                </p>
                <div className="flex gap-3">
                  <CreateDefaultTemplateButton />
                  <Link href="/dashboard/checkins/templates">
                    <Button variant="outline">カスタムテンプレートを作成</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                管理者にテンプレートの作成を依頼してください。
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TemplateBasedCheckIn />
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>チェックイン履歴</CardTitle>
                <CardDescription>過去のチェックイン記録</CardDescription>
              </CardHeader>
              <CardContent>
                <CheckInHistory checkIns={checkInHistory} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
