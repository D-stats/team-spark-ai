import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, CheckSquare, Users, TrendingUp } from 'lucide-react';
import { KudosFeed } from '@/components/kudos/kudos-feed';
import { cn } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();
  const t = await getTranslations('dashboard');

  // Get statistical data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Number of Kudos this month
  const thisMonthKudos = await prisma.kudos.count({
    where: {
      OR: [
        { senderId: dbUser.id },
        { receiverId: dbUser.id },
        {
          AND: [{ isPublic: true }, { sender: { organizationId: dbUser.organizationId } }],
        },
      ],
      createdAt: { gte: startOfMonth },
    },
  });

  // Check-in completion rate this week
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

  const checkInCompletionRate =
    organizationUsers > 0 ? Math.round((thisWeekCheckIns / organizationUsers) * 100) : 0;

  // 平均気分スコア（簡易エンゲージメントスコア）
  const recentCheckIns = await prisma.checkIn.findMany({
    where: {
      user: { organizationId: dbUser.organizationId },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 過去30日
    },
    select: { moodRating: true },
  });

  const averageMoodScore =
    recentCheckIns.length > 0
      ? (
          recentCheckIns.reduce((sum, checkin) => sum + (checkin.moodRating ?? 0), 0) /
          recentCheckIns.length
        ).toFixed(1)
      : 'N/A';

  const stats = [
    {
      title: t('stats.monthlyKudos.title'),
      value: thisMonthKudos.toString(),
      description: t('stats.monthlyKudos.description'),
      icon: Heart,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: t('stats.checkinRate.title'),
      value: `${checkInCompletionRate}%`,
      description: t('stats.checkinRate.description'),
      icon: CheckSquare,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('stats.teamMembers.title'),
      value: organizationUsers.toString(),
      description: t('stats.teamMembers.description'),
      icon: Users,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('stats.engagementScore.title'),
      value: averageMoodScore === 'N/A' ? 'N/A' : `${averageMoodScore}/5`,
      description:
        recentCheckIns.length > 0
          ? t('stats.engagementScore.description')
          : t('stats.engagementScore.notStarted'),
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('welcome', { name: dbUser.name })}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
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
            <CardTitle>{t('recentKudos.title')}</CardTitle>
            <CardDescription>{t('recentKudos.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentKudos userId={dbUser.id} organizationId={dbUser.organizationId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('recentCheckins.title')}</CardTitle>
            <CardDescription>{t('recentCheckins.description')}</CardDescription>
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
  const t = await getTranslations('dashboard');
  const recentKudos = await prisma.kudos.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
        {
          AND: [{ isPublic: true }, { sender: { organizationId } }],
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
    return <p className="text-sm text-muted-foreground">{t('recentKudos.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      <KudosFeed kudos={recentKudos} />
    </div>
  );
}

async function RecentCheckIns({ organizationId }: { organizationId: string }) {
  const t = await getTranslations('dashboard');
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
      template: {
        select: {
          name: true,
          questions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  if (recentCheckIns.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('recentCheckins.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {recentCheckIns.map((checkIn) => {
        // Display the answer to the first question (usually achievements or reflections)
        const answers = checkIn.answers as Record<string, unknown>;
        const firstAnswer = answers !== null ? Object.values(answers)[0] : null;
        const displayText =
          typeof firstAnswer === 'string' ? firstAnswer : t('recentCheckins.noResponse');

        return (
          <div key={checkIn.id} className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
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
                      star <= (checkIn.moodRating ?? 0) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{displayText}</p>
          </div>
        );
      })}
    </div>
  );
}
