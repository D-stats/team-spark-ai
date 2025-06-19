'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface NotificationSettingsProps {
  user: User;
}

export function NotificationSettings(_props: NotificationSettingsProps) {
  // デフォルト設定（実際のプロジェクトでは DB から取得）
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [kudosNotifications, setKudosNotifications] = useState(true);
  const [checkinReminders, setCheckinReminders] = useState(true);
  const [surveyNotifications, setSurveyNotifications] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications,
          kudosNotifications,
          checkinReminders,
          surveyNotifications,
          teamUpdates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '通知設定の更新に失敗しました');
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          通知設定が正常に更新されました
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              メール通知
            </CardTitle>
            <CardDescription>
              メールで通知を受信するかどうかを設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">メール通知を有効にする</Label>
                <p className="text-sm text-muted-foreground">
                  すべてのメール通知の送信を制御します
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              活動通知
            </CardTitle>
            <CardDescription>
              アプリ内の活動に関する通知設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="kudos-notifications">Kudos通知</Label>
                <p className="text-sm text-muted-foreground">
                  Kudosを受け取った時の通知
                </p>
              </div>
              <Switch
                id="kudos-notifications"
                checked={kudosNotifications}
                onCheckedChange={setKudosNotifications}
                disabled={loading || !emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="checkin-reminders">チェックインリマインダー</Label>
                <p className="text-sm text-muted-foreground">
                  週次チェックインの締切が近い時の通知
                </p>
              </div>
              <Switch
                id="checkin-reminders"
                checked={checkinReminders}
                onCheckedChange={setCheckinReminders}
                disabled={loading || !emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="survey-notifications">サーベイ通知</Label>
                <p className="text-sm text-muted-foreground">
                  新しいサーベイが作成された時の通知
                </p>
              </div>
              <Switch
                id="survey-notifications"
                checked={surveyNotifications}
                onCheckedChange={setSurveyNotifications}
                disabled={loading || !emailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              チーム通知
            </CardTitle>
            <CardDescription>
              チームに関する通知設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="team-updates">チーム更新通知</Label>
                <p className="text-sm text-muted-foreground">
                  チームメンバーの追加・削除などの更新通知
                </p>
              </div>
              <Switch
                id="team-updates"
                checked={teamUpdates}
                onCheckedChange={setTeamUpdates}
                disabled={loading || !emailNotifications}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? '更新中...' : '通知設定を更新'}
        </Button>
      </div>
    </form>
  );
}