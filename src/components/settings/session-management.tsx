'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, Globe, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

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
  const t = useTranslations('settings.sessions');
  const locale = useLocale();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const loadSessions = async (): Promise<void> => {
    try {
      const [sessionsResponse, currentSessionResponse] = await Promise.all([
        fetch('/api/user/sessions'),
        fetch('/api/user/current-session'),
      ]);
      
      if (sessionsResponse.ok) {
        const data = (await sessionsResponse.json()) as Session[];
        setSessions(data);
      }
      
      if (currentSessionResponse.ok) {
        const currentData = (await currentSessionResponse.json()) as { currentSessionId: string | null };
        setCurrentSessionId(currentData.currentSessionId);
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
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [t]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([loadSessions(), loadLoginHistory()]);
    } catch (error) {
      setError(t('error'));
    } finally {
      setRefreshing(false);
    }
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/user/sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const responseData = (await response.json()) as { 
          message: string; 
          shouldSignOut?: boolean 
        };
        
        // If this was the current session, sign out immediately
        if (responseData.shouldSignOut) {
          await signOut({ 
            callbackUrl: `/${locale}/login`,
            redirect: true 
          });
          return;
        }
        
        // Otherwise, just refresh the session list
        await loadSessions();
        await loadLoginHistory();
        
        // Trigger immediate session validation for all tabs
        window.postMessage({ type: 'SESSION_TERMINATED', sessionId }, '*');
      } else {
        const errorData = (await response.json()) as { error?: string };
        setError(errorData.error ?? t('active.revokeError'));
      }
    } catch (error) {
      setError(t('active.revokeError'));
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
    if (userAgent === null || userAgent === undefined || userAgent === '')
      return t('unknownDevice');

    const agent = userAgent.toLowerCase();

    // Browser detection
    let browser = t('unknownBrowser');
    if (agent.includes('chrome')) browser = 'Chrome';
    else if (agent.includes('firefox')) browser = 'Firefox';
    else if (agent.includes('safari')) browser = 'Safari';
    else if (agent.includes('edge')) browser = 'Edge';

    // OS detection
    let os = '';
    if (agent.includes('windows')) os = 'Windows';
    else if (agent.includes('mac')) os = 'macOS';
    else if (agent.includes('linux')) os = 'Linux';
    else if (agent.includes('android')) os = 'Android';
    else if (agent.includes('ios') || agent.includes('iphone') || agent.includes('ipad'))
      os = 'iOS';

    return os !== '' ? `${browser}${t('deviceInfoConnector')}${os}` : browser;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="py-8 text-center">{t('loading')}</div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                {t('active.title')}
              </CardTitle>
              <CardDescription>{t('active.description')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-4"
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('loading') : t('active.refreshButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">{t('active.noSessions')}</p>
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
                        IP: {session.ipAddress ?? t('unknown')} •{' '}
                        {t('active.lastUsed', {
                          time: formatDistanceToNow(new Date(session.lastUsedAt), {
                            addSuffix: true,
                            locale: locale === 'ja' ? ja : enUS,
                          }),
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('active.sessionStarted', {
                          time: formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                            locale: locale === 'ja' ? ja : enUS,
                          }),
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.id === currentSessionId ? (
                      <Badge variant="default">{t('active.currentSession')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('active.statusActive')}</Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => revokeSession(session.id)}
                      className={session.id === currentSessionId ? 'text-red-600 hover:text-red-700' : ''}
                    >
                      <LogOut className="mr-1 h-3 w-3" />
                      {session.id === currentSessionId ? t('active.signOut') : t('active.revokeButton')}
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
            {t('history.title')}
          </CardTitle>
          <CardDescription>{t('history.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">{t('history.noHistory')}</p>
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
                        IP: {item.ipAddress ?? t('unknown')} •{' '}
                        {formatDistanceToNow(new Date(item.loginAt), {
                          addSuffix: true,
                          locale: locale === 'ja' ? ja : enUS,
                        })}
                      </div>
                      {!item.success &&
                        item.failReason !== null &&
                        item.failReason !== undefined &&
                        item.failReason !== '' && (
                          <div className="text-xs text-destructive">
                            {t('history.failReason', { reason: item.failReason })}
                          </div>
                        )}
                    </div>
                  </div>
                  <Badge variant={item.success ? 'default' : 'destructive'}>
                    {item.success ? t('history.success') : t('history.failed')}
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
