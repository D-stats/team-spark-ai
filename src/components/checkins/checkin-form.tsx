'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export function CheckInForm() {
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextWeekGoals, setNextWeekGoals] = useState('');
  const [moodRating, setMoodRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          achievements,
          challenges: challenges || undefined,
          nextWeekGoals,
          moodRating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create check-in');
      }

      // Refresh page to display new check-in
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="achievements">今週達成したこと *</Label>
        <Textarea
          id="achievements"
          placeholder="今週完了したタスクや達成した目標について記入してください..."
          value={achievements}
          onChange={(e) => setAchievements(e.target.value)}
          required
          disabled={loading}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mood">気分・満足度 *</Label>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`text-2xl transition-colors ${
                    rating <= moodRating
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                  onClick={() => setMoodRating(rating)}
                  disabled={loading}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {moodRating === 0 && '評価を選択してください'}
                {moodRating === 1 && '1 - とても悪い'}
                {moodRating === 2 && '2 - 悪い'}
                {moodRating === 3 && '3 - 普通'}
                {moodRating === 4 && '4 - 良い'}
                {moodRating === 5 && '5 - とても良い'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label htmlFor="challenges">今週の課題・困難（任意）</Label>
        <Textarea
          id="challenges"
          placeholder="今週遭遇した課題や困難について記入してください..."
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextWeekGoals">来週の目標 *</Label>
        <Textarea
          id="nextWeekGoals"
          placeholder="来週達成したい目標や取り組みたいことを記入してください..."
          value={nextWeekGoals}
          onChange={(e) => setNextWeekGoals(e.target.value)}
          required
          disabled={loading}
          rows={4}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !achievements || !nextWeekGoals || moodRating === 0}
      >
        {loading ? 'チェックインを作成中...' : 'チェックインを作成'}
      </Button>
    </form>
  );
}
