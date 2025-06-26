'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slack, Check, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  slackUserId?: string | null;
}

interface SlackWorkspace {
  id: string;
  teamName: string;
  teamId: string;
}

interface SlackUserSettingsProps {
  user: User;
  slackWorkspace: SlackWorkspace;
}

export function SlackUserSettings({ user, slackWorkspace }: SlackUserSettingsProps) {
  const [slackEmail, setSlackEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleConnectSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/slack-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slackEmail: slackEmail || user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Slack連携に失敗しました');
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectSlack = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/slack-connect', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Slack連携解除に失敗しました');
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
    <div className="space-y-6">
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            {user.slackUserId ? 'Slack連携が完了しました' : 'Slack連携を解除しました'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">連携ワークスペース</h4>
          <div className="flex items-center space-x-2">
            <Slack className="h-4 w-4" />
            <span className="text-sm">{slackWorkspace.teamName}</span>
          </div>
        </div>

        {user.slackUserId ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Slack連携状態</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    SlackユーザーID: {user.slackUserId}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="mr-1 h-3 w-3" />
                  連携済み
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">利用可能な機能</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✅ /kudos コマンドでKudosを送信</li>
                <li>✅ Kudos受信時のSlack通知</li>
                <li>✅ チェックインリマインダー</li>
                <li>✅ サーベイ通知</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDisconnectSlack} disabled={loading}>
                {loading ? '処理中...' : 'Slack連携を解除'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectSlack} className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Slackアカウントと連携するには、Slackで使用しているメールアドレスを入力してください。
                TeamSpark AIのメールアドレスと同じ場合は、そのまま連携できます。
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="slackEmail">Slackメールアドレス</Label>
              <Input
                id="slackEmail"
                type="email"
                value={slackEmail}
                onChange={(e) => setSlackEmail(e.target.value)}
                placeholder={user.email}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                空欄の場合は、TeamSpark AIのメールアドレス ({user.email}) を使用します
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              <Slack className="mr-2 h-4 w-4" />
              {loading ? '連携中...' : 'Slackと連携'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
