'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, Globe, LogOut, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Session {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt: string;
  createdAt: string;
  expiresAt: string;
}

interface LoginHistoryItem {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
  success: boolean;
  failReason?: string | null;
  loginAt: string;
}

export function SessionManagement(): JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/sessions');
      if (response.ok) {
        const data = (await response.json()) as Session[];
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadLoginHistory = async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/login-history?limit=10');
      if (response.ok) {
        const data = (await response.json()) as { history: LoginHistoryItem[] };
        setLoginHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load login history:', error);
    }
  };

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoading(true);
      try {
        await Promise.all([loadSessions(), loadLoginHistory()]);
      } catch (error) {
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const revokeSession = async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/user/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSessions(); // セッションリストを再読み込み
      } else {
        const errorData = (await response.json()) as { error?: string };
        setError(errorData.error ?? 'セッションの終了に失敗しました');
      }
    } catch (error) {
      setError('セッションの終了に失敗しました');
    }
  };

  const getDeviceIcon = (userAgent?: string | null): React.ReactNode => {
    if (userAgent === null || userAgent === undefined || userAgent === '')
      return <Monitor className="h-4 w-4" />;

    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (agent.includes('tablet') || agent.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceInfo = (userAgent?: string | null, deviceInfo?: string | null): string => {
    if (deviceInfo !== null && deviceInfo !== undefined && deviceInfo !== '') return deviceInfo;
    if (userAgent === null || userAgent === undefined || userAgent === '') return '不明なデバイス';

    const agent = userAgent.toLowerCase();

    // ブラウザ検出
    let browser = '不明なブラウザ';
    if (agent.includes('chrome')) browser = 'Chrome';
    else if (agent.includes('firefox')) browser = 'Firefox';
    else if (agent.includes('safari')) browser = 'Safari';
    else if (agent.includes('edge')) browser = 'Edge';

    // OS検出
    let os = '';
    if (agent.includes('windows')) os = 'Windows';
    else if (agent.includes('mac')) os = 'macOS';
    else if (agent.includes('linux')) os = 'Linux';
    else if (agent.includes('android')) os = 'Android';
    else if (agent.includes('ios') || agent.includes('iphone') || agent.includes('ipad'))
      os = 'iOS';

    return os !== '' ? `${browser} on ${os}` : browser;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="py-8 text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error !== null && error !== '' && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            アクティブセッション
          </CardTitle>
          <CardDescription>現在ログインしているデバイスとセッションの一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              アクティブなセッションがありません
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(session.userAgent)}
                    <div>
                      <div className="font-medium">
                        {getDeviceInfo(session.userAgent, session.deviceInfo)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        IP: {session.ipAddress ?? '不明'} • 最終利用:{' '}
                        {formatDistanceToNow(new Date(session.lastUsedAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        セッション開始:{' '}
                        {formatDistanceToNow(new Date(session.createdAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">アクティブ</Badge>
                    <Button variant="outline" size="sm" onClick={() => revokeSession(session.id)}>
                      <LogOut className="mr-1 h-3 w-3" />
                      終了
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            ログイン履歴
          </CardTitle>
          <CardDescription>最近のログイン活動を確認できます</CardDescription>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">ログイン履歴がありません</p>
          ) : (
            <div className="space-y-3">
              {loginHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    {item.success ? (
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {getDeviceInfo(item.userAgent, item.deviceInfo)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        IP: {item.ipAddress ?? '不明'} •
                        {formatDistanceToNow(new Date(item.loginAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </div>
                      {!item.success &&
                        item.failReason !== null &&
                        item.failReason !== undefined &&
                        item.failReason !== '' && (
                          <div className="text-xs text-destructive">
                            失敗理由: {item.failReason}
                          </div>
                        )}
                    </div>
                  </div>
                  <Badge variant={item.success ? 'default' : 'destructive'}>
                    {item.success ? '成功' : '失敗'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
