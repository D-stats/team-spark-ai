'use client';

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  text: string;
  required: boolean;
}

interface CheckInTemplate {
  id: string;
  name: string;
  frequency: string;
  questions: Question[];
}

interface CheckIn {
  id: string;
  templateId: string;
  answers: any; // JsonValue型対応
  moodRating?: number | null;
  createdAt: Date;
  template: CheckInTemplate;
}

interface CheckInHistoryProps {
  checkIns: CheckIn[];
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps) {
  if (checkIns.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p>まだチェックイン履歴がありません</p>
        <p className="text-sm">初回のチェックインを作成してみましょう！</p>
      </div>
    );
  }

  // 平均気分スコアを計算（気分評価がある場合のみ）
  const checkInsWithMood = checkIns.filter(
    (c) => c.moodRating !== null && c.moodRating !== undefined,
  );
  const averageMood =
    checkInsWithMood.length > 0
      ? (
          checkInsWithMood.reduce((sum, checkIn) => sum + (checkIn.moodRating || 0), 0) /
          checkInsWithMood.length
        ).toFixed(1)
      : null;

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      DAILY: '毎日',
      WEEKLY: '毎週',
      BIWEEKLY: '隔週',
      MONTHLY: '毎月',
      QUARTERLY: '四半期',
      CUSTOM: 'カスタム',
    };
    return labels[frequency] || frequency;
  };

  const renderAnswerValue = (question: Question, answer: any) => {
    if (answer === undefined || answer === null || answer === '') {
      return <span className="italic text-gray-400">未回答</span>;
    }

    if (question.type === 'rating') {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-sm ${star <= answer ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{answer}/5</span>
        </div>
      );
    }

    return <span className="text-sm">{String(answer)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* 統計情報 */}
      <Card className="bg-primary/5">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center space-x-2">
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
              <div className="font-semibold">{averageMood ? `${averageMood}/5` : '---'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* チェックイン履歴 */}
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <Card key={checkIn.id} className="transition-colors hover:bg-muted/30">
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{checkIn.template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {getFrequencyLabel(checkIn.template.frequency)}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  {checkIn.moodRating && (
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= checkIn.moodRating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{checkIn.moodRating}/5</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(checkIn.createdAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {checkIn.template.questions.slice(0, 2).map((question) => (
                  <div key={question.id}>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {question.text}
                    </div>
                    <div className="line-clamp-2">
                      {renderAnswerValue(question, checkIn.answers[question.id])}
                    </div>
                  </div>
                ))}
                {checkIn.template.questions.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    ...他{checkIn.template.questions.length - 2}問の回答
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
