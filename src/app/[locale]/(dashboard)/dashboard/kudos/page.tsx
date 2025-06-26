import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { KudosForm } from '@/components/kudos/kudos-form';
import { KudosFeed } from '@/components/kudos/kudos-feed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function KudosPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // 組織内のユーザーを取得（自分以外）
  const users = await prisma.user.findMany({
    where: {
      organizationId: dbUser.organizationId,
      id: { not: dbUser.id },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  // 最近のKudosを取得
  const recentKudos = await prisma.kudos.findMany({
    where: {
      OR: [
        { senderId: dbUser.id },
        { receiverId: dbUser.id },
        {
          AND: [
            { isPublic: true },
            {
              sender: { organizationId: dbUser.organizationId },
            },
          ],
        },
      ],
    },
    include: {
      sender: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      receiver: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kudos</h1>
        <p className="mt-2 text-muted-foreground">
          チームメンバーに感謝を伝えましょう
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Kudosを送る</CardTitle>
              <CardDescription>
                チームメンバーの素晴らしい仕事や協力に感謝を伝えましょう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KudosForm users={users} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>最近のKudos</CardTitle>
              <CardDescription>
                チーム内で送られたKudosの一覧
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KudosFeed kudos={recentKudos} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}