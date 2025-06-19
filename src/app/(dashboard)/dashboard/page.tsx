import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, CheckSquare, Users, TrendingUp } from 'lucide-react';
import { KudosFeed } from '@/components/kudos/kudos-feed';
import { cn } from '@/lib/utils';

export default async function DashboardPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // 統計データを取得
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // 今月のKudos数
  const thisMonthKudos = await prisma.kudos.count({
    where: {
      OR: [
        { senderId: dbUser.id },
        { receiverId: dbUser.id },
        {
          AND: [
            { isPublic: true },
            { sender: { organizationId: dbUser.organizationId } },
          ],
        },
      ],
      createdAt: { gte: startOfMonth },
    },
  });

  // 今週のチェックイン完了率
  const organizationUsers = await prisma.user.count({
    where: {
      organizationId: dbUser.organizationId,
      isActive: true,
    },
  });

  const thisWeekCheckIns = await prisma.checkIn.count({
    where: {
      user: { organizationId: dbUser.organizationId },
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });

  const checkInCompletionRate = organizationUsers > 0 
    ? Math.round((thisWeekCheckIns / organizationUsers) * 100)
    : 0;

  // 平均気分スコア（簡易エンゲージメントスコア）
  const recentCheckIns = await prisma.checkIn.findMany({
    where: {
      user: { organizationId: dbUser.organizationId },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 過去30日
    },
    select: { moodRating: true },
  });

  const averageMoodScore = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((sum, checkin) => sum + checkin.moodRating, 0) / recentCheckIns.length).toFixed(1)
    : 'N/A';

  const stats = [
    {
      title: '今月のKudos',
      value: thisMonthKudos.toString(),
      description: 'チーム内で送受信',
      icon: Heart,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'チェックイン完了率',
      value: `${checkInCompletionRate}%`,
      description: '今週のチェックイン',
      icon: CheckSquare,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'チームメンバー',
      value: organizationUsers.toString(),
      description: 'アクティブメンバー',
      icon: Users,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'エンゲージメントスコア',
      value: averageMoodScore === 'N/A' ? 'N/A' : `${averageMoodScore}/5`,
      description: recentCheckIns.length > 0 ? '過去30日平均' : '計測開始前',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          ようこそ、{dbUser.name}さん
        </h1>
        <p className="mt-2 text-muted-foreground">
          チームのエンゲージメント状況を確認しましょう
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={cn('rounded-lg p-2', stat.bgColor)}>
                <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近のKudos</CardTitle>
            <CardDescription>チームメンバーからの感謝メッセージ</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentKudos userId={dbUser.id} organizationId={dbUser.organizationId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近のチェックイン</CardTitle>
            <CardDescription>チームの活動状況</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentCheckIns organizationId={dbUser.organizationId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function RecentKudos({ userId, organizationId }: { userId: string; organizationId: string }) {
  const recentKudos = await prisma.kudos.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
        {
          AND: [
            { isPublic: true },
            { sender: { organizationId } },
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
    take: 3,
  });

  if (recentKudos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        まだKudosがありません。チームメンバーに感謝を伝えてみましょう！
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <KudosFeed kudos={recentKudos} />
    </div>
  );
}

async function RecentCheckIns({ organizationId }: { organizationId: string }) {
  const recentCheckIns = await prisma.checkIn.findMany({
    where: {
      user: { organizationId },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  if (recentCheckIns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        まだチェックインがありません。週次チェックインを開始してみましょう！
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recentCheckIns.map((checkIn) => (
        <div key={checkIn.id} className="p-3 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                {checkIn.user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium">{checkIn.user.name}</span>
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xs ${
                    star <= checkIn.moodRating
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {checkIn.achievements}
          </p>
        </div>
      ))}
    </div>
  );
}