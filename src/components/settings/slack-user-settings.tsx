'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

export function SlackUserSettings({ user, slackWorkspace }: SlackUserSettingsProps): JSX.Element {
  const t = useTranslations('settings.slack');
  const [slackEmail, setSlackEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleConnectSlack = async (e: React.FormEvent): Promise<void> => {
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
          slackEmail: slackEmail !== '' ? slackEmail : user.email,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? t('errors.connectionFailed'));
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectSlack = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/slack-connect', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? t('errors.disconnectionFailed'));
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error !== null && error !== '' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            {user.slackUserId !== null && user.slackUserId !== undefined
              ? t('success.connected')
              : t('success.disconnected')}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">{t('workspace.title')}</h4>
          <div className="flex items-center space-x-2">
            <Slack className="h-4 w-4" />
            <span className="text-sm">{slackWorkspace.teamName}</span>
          </div>
        </div>

        {user.slackUserId !== null && user.slackUserId !== undefined ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('status.title')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('status.userIdLabel')}: {user.slackUserId}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="mr-1 h-3 w-3" />
                  {t('status.connected')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('features.title')}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✅ {t('features.kudosCommand')}</li>
                <li>✅ {t('features.notifications')}</li>
                <li>✅ {t('features.checkinReminders')}</li>
                <li>✅ {t('features.surveyNotifications')}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDisconnectSlack} disabled={loading}>
                {loading ? t('actions.processing') : t('actions.disconnect')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectSlack} className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('form.instructions')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="slackEmail">{t('form.emailLabel')}</Label>
              <Input
                id="slackEmail"
                type="email"
                value={slackEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlackEmail(e.target.value)}
                placeholder={user.email}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('form.emailDescription', { email: user.email })}
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              <Slack className="mr-2 h-4 w-4" />
              {loading ? t('actions.connecting') : t('actions.connect')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}