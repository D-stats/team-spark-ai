'use client';

import { formatDistanceToNow } from 'date-fns';
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
  answers: Record<string, unknown>; // JsonValue type support
  moodRating?: number | null;
  createdAt: Date;
  template: CheckInTemplate;
}

interface CheckInHistoryProps {
  checkIns: CheckIn[];
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps): JSX.Element {
  if (checkIns.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p>No check-in history yet</p>
        <p className="text-sm">初回のチェックインを作成してみましょう！</p>
      </div>
    );
  }

  // Calculate average mood score (only when mood rating exists)
  const checkInsWithMood = checkIns.filter(
    (c) => c.moodRating !== null && c.moodRating !== undefined,
  );
  const averageMood =
    checkInsWithMood.length > 0
      ? (
          checkInsWithMood.reduce((sum, checkIn) => sum + (checkIn.moodRating ?? 0), 0) /
          checkInsWithMood.length
        ).toFixed(1)
      : null;

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      CUSTOM: 'Custom',
    };
    return labels[frequency] ?? frequency;
  };

  const renderAnswerValue = (question: Question, answer: unknown) => {
    if (answer === undefined || answer === null || answer === '') {
      return <span className="italic text-gray-400">No answer</span>;
    }

    if (question.type === 'rating') {
      const rating = typeof answer === 'number' ? answer : 0;
      return (
        <div className="flex items-center space-x-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{rating}/5</span>
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
              <div className="text-muted-foreground">Average Mood Score</div>
              <div className="font-semibold">{averageMood !== null ? `${averageMood}/5` : '---'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in History */}
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
                  {checkIn.moodRating !== null && checkIn.moodRating !== undefined && (
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= (checkIn.moodRating ?? 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
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
