import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { CreateSurveyDialog } from '@/components/surveys/create-survey-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default async function SurveysPage(): Promise<JSX.Element> {
  const { dbUser } = await requireAuthWithOrganization();

  // 組織のサーベイを取得
  const surveys = await prisma.survey.findMany({
    where: {
      organizationId: dbUser.organizationId,
    },
    include: {
      _count: {
        select: {
          responses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 組織内のユーザー数を取得
  const totalUsers = await prisma.user.count({
    where: {
      organizationId: dbUser.organizationId,
      isActive: true,
    },
  });

  const isAdmin = dbUser.role === 'ADMIN';
  const isManager = dbUser.role === 'MANAGER' || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">サーベイ</h1>
          <p className="mt-2 text-muted-foreground">チームの意見や満足度を調査します</p>
        </div>
        {isManager && <CreateSurveyDialog />}
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">サーベイがありません</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              まだサーベイが作成されていません。
              <br />
              {isManager
                ? '最初のサーベイを作成してみましょう。'
                : 'マネージャーがサーベイを作成するまでお待ちください。'}
            </p>
            {isManager && <CreateSurveyDialog />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => {
            const responseRate =
              totalUsers > 0 ? Math.round((survey._count.responses / totalUsers) * 100) : 0;

            const isActive = survey.isActive;
            const hasDeadline = survey.endDate !== null;
            const isExpired = hasDeadline && new Date(survey.endDate!) < new Date();

            return (
              <Card key={survey.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-lg">{survey.title}</CardTitle>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant={
                            isActive === true && isExpired === false ? 'default' : 'secondary'
                          }
                          className={
                            isActive === true && isExpired === false
                              ? 'bg-green-100 text-green-800'
                              : ''
                          }
                        >
                          {isExpired === true
                            ? '期限切れ'
                            : isActive === true
                              ? 'アクティブ'
                              : '下書き'}
                        </Badge>
                        {hasDeadline && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(survey.endDate!).toLocaleDateString('ja-JP')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {survey.description !== null && (
                    <CardDescription className="line-clamp-2">{survey.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="mr-1 h-4 w-4" />
                        回答率
                      </div>
                      <div className="font-medium">
                        {survey._count.responses}/{totalUsers} ({responseRate}%)
                      </div>
                    </div>

                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/surveys/${survey.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          詳細を見る
                        </Button>
                      </Link>
                      {isActive && !isExpired && (
                        <Link href={`/dashboard/surveys/${survey.id}/respond`} className="flex-1">
                          <Button size="sm" className="w-full">
                            回答する
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
