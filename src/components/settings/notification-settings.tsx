'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, MessageSquare } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface NotificationSettingsProps {
  user: User;
}

export function NotificationSettings({ user: _user }: NotificationSettingsProps): JSX.Element {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [kudosNotifications, setKudosNotifications] = useState(true);
  const [checkinReminders, setCheckinReminders] = useState(true);
  const [surveyNotifications, setSurveyNotifications] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState<'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    'WEEKLY',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // 通知設定を読み込む
  const loadNotificationSettings = async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const settings = (await response.json()) as {
          emailNotifications: boolean;
          kudosNotifications: boolean;
          checkinReminders: boolean;
          surveyNotifications: boolean;
          teamUpdates: boolean;
          digestFrequency: 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
        };
        setEmailNotifications(settings.emailNotifications);
        setKudosNotifications(settings.kudosNotifications);
        setCheckinReminders(settings.checkinReminders);
        setSurveyNotifications(settings.surveyNotifications);
        setTeamUpdates(settings.teamUpdates);
        setDigestFrequency(settings.digestFrequency);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  React.useEffect(() => {
    void loadNotificationSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
          digestFrequency,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? '通知設定の更新に失敗しました');
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error !== null && error !== '' ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          通知設定が正常に更新されました
        </div>
      ) : null}

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Mail className="mr-2 h-4 w-4" />
              メール通知
            </CardTitle>
            <CardDescription>メールで通知を受信するかどうかを設定します</CardDescription>
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
            <CardTitle className="flex items-center text-base">
              <Bell className="mr-2 h-4 w-4" />
              活動通知
            </CardTitle>
            <CardDescription>アプリ内の活動に関する通知設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="kudos-notifications">Kudos通知</Label>
                <p className="text-sm text-muted-foreground">Kudosを受け取った時の通知</p>
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
                <p className="text-sm text-muted-foreground">新しいサーベイが作成された時の通知</p>
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
            <CardTitle className="flex items-center text-base">
              <MessageSquare className="mr-2 h-4 w-4" />
              チーム通知
            </CardTitle>
            <CardDescription>チームに関する通知設定</CardDescription>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Mail className="mr-2 h-4 w-4" />
              通知頻度設定
            </CardTitle>
            <CardDescription>通知ダイジェストの配信頻度を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="digest-frequency">ダイジェスト配信頻度</Label>
              <Select
                value={digestFrequency}
                onValueChange={(value: 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY') =>
                  setDigestFrequency(value)
                }
                disabled={loading || !emailNotifications}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEVER">配信しない</SelectItem>
                  <SelectItem value="DAILY">毎日</SelectItem>
                  <SelectItem value="WEEKLY">毎週</SelectItem>
                  <SelectItem value="MONTHLY">毎月</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                活動の要約をメールで定期的に受け取ります
              </p>
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
