'use client';

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';

interface CheckIn {
  id: string;
  achievements: string;
  challenges?: string | null;
  nextWeekGoals: string;
  moodRating: number;
  createdAt: Date;
}

interface CheckInHistoryProps {
  checkIns: CheckIn[];
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps) {
  if (checkIns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="mx-auto h-12 w-12 mb-4 opacity-30" />
        <p>まだチェックイン履歴がありません</p>
        <p className="text-sm">初回のチェックインを作成してみましょう！</p>
      </div>
    );
  }

  // 平均気分スコアを計算
  const averageMood = checkIns.length > 0 
    ? (checkIns.reduce((sum, checkIn) => sum + checkIn.moodRating, 0) / checkIns.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      {/* 統計情報 */}
      <Card className="bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">統計</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">総チェックイン数</div>
              <div className="font-semibold">{checkIns.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">平均気分スコア</div>
              <div className="font-semibold">{averageMood}/5</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* チェックイン履歴 */}
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <Card key={checkIn.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= checkIn.moodRating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {checkIn.moodRating}/5
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(checkIn.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">達成:</span>
                  <p className="mt-1 line-clamp-2">{checkIn.achievements}</p>
                </div>
                
                {checkIn.challenges && (
                  <div>
                    <span className="font-medium text-muted-foreground">課題:</span>
                    <p className="mt-1 line-clamp-2">{checkIn.challenges}</p>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-muted-foreground">来週目標:</span>
                  <p className="mt-1 line-clamp-2">{checkIn.nextWeekGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}