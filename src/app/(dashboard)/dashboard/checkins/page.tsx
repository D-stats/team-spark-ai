import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { CheckInForm } from '@/components/checkins/checkin-form';
import { CheckInHistory } from '@/components/checkins/checkin-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CheckInsPage() {
  const { dbUser } = await requireAuthWithOrganization();

  // 今週のチェックインがあるかチェック
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const currentWeekCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId: dbUser.id,
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });

  // 過去のチェックイン履歴を取得
  const checkInHistory = await prisma.checkIn.findMany({
    where: {
      userId: dbUser.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">週次チェックイン</h1>
        <p className="mt-2 text-muted-foreground">
          今週の振り返りと来週の目標を設定しましょう
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentWeekCheckIn ? '今週のチェックイン' : '今週のチェックイン作成'}
              </CardTitle>
              <CardDescription>
                {currentWeekCheckIn 
                  ? 'この週のチェックインは既に完了しています'
                  : '今週の成果や気持ちを記録しましょう'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentWeekCheckIn ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">今週達成したこと</h3>
                    <p className="text-sm">{String(currentWeekCheckIn.achievements)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">気分・満足度</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= currentWeekCheckIn.moodRating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {currentWeekCheckIn.moodRating}/5
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">来週の目標</h3>
                    <p className="text-sm">{String(currentWeekCheckIn.nextWeekGoals)}</p>
                  </div>
                  {currentWeekCheckIn.challenges && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">今週の課題・困難</h3>
                      <p className="text-sm">{String(currentWeekCheckIn.challenges)}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    作成日: {new Date(currentWeekCheckIn.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ) : (
                <CheckInForm />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>チェックイン履歴</CardTitle>
              <CardDescription>
                過去のチェックイン記録
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CheckInHistory checkIns={checkInHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}