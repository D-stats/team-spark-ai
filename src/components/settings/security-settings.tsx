'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Monitor, Smartphone, Tablet, Globe, Shield, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface UserSession {
  id: string;
  sessionId: string;
  device: string | null;
  ipAddress: string | null;
  location: string | null;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

interface LoginHistoryEntry {
  id: string;
  ipAddress: string | null;
  device: string | null;
  location: string | null;
  success: boolean;
  method: string;
  createdAt: string;
}

export function SecuritySettings() {
  const t = useTranslations('settings.security');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRevokingSession, setIsRevokingSession] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchLoginHistory();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/user/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await fetch('/api/user/login-history');
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch login history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    setIsRevokingSession(sessionId);

    try {
      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      if (isCurrent) {
        // If revoking current session, redirect to login
        toast.success(t('activeSessions.revokeSuccess'));
        router.push('/login');
      } else {
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
        toast.success(t('activeSessions.revokeSuccess'));
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error(t('activeSessions.revokeError'));
    } finally {
      setIsRevokingSession(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setIsRevokingAll(true);

    try {
      const response = await fetch('/api/user/sessions/revoke-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }

      setSessions(prev => prev.filter(session => session.isCurrent));
      toast.success(t('activeSessions.revokeSuccess'));
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      toast.error(t('activeSessions.revokeError'));
    } finally {
      setIsRevokingAll(false);
    }
  };

  const getDeviceIcon = (device: string | null) => {
    if (!device) return <Monitor className="h-4 w-4" />;
    
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('mobile') || deviceLower.includes('android') || deviceLower.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ja });
  };

  const formatLoginTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm', { locale: ja });
  };

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('activeSessions.title')}</CardTitle>
              <CardDescription>{t('activeSessions.description')}</CardDescription>
            </div>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    {t('activeSessions.revokeAllOther')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      {t('activeSessions.revokeAllOther')}
                    </DialogTitle>
                    <DialogDescription>
                      This will log you out of all other devices. You will remain logged in on this device.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleRevokeAllOtherSessions}
                      disabled={isRevokingAll}
                    >
                      {isRevokingAll ? tCommon('loading') : t('activeSessions.revokeAllOther')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active sessions</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(session.device)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session.device || 'Unknown Device'}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            {t('activeSessions.current')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {session.location && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.location}
                          </div>
                        )}
                        {session.ipAddress && (
                          <div className="text-xs">IP: {session.ipAddress}</div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastActive(session.lastUsedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.sessionId, session.isCurrent)}
                    disabled={isRevokingSession === session.sessionId}
                  >
                    {isRevokingSession === session.sessionId 
                      ? tCommon('loading') 
                      : t('activeSessions.revokeSession')
                    }
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('loginHistory.title')}</CardTitle>
          <CardDescription>{t('loginHistory.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : loginHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('loginHistory.noHistory')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('loginHistory.device')}</TableHead>
                  <TableHead>{t('loginHistory.location')}</TableHead>
                  <TableHead>{t('loginHistory.ipAddress')}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{tCommon('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(entry.device)}
                        <span className="text-sm">
                          {entry.device || 'Unknown Device'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.location ? (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span className="text-sm">{entry.location}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {entry.ipAddress || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={entry.success ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {entry.success ? t('loginHistory.success') : t('loginHistory.failed')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatLoginTime(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication (Future Enhancement) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('twoFactor.title')}
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>{t('twoFactor.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium">{t('twoFactor.disabled')}</span>
              </p>
            </div>
            <Button disabled variant="outline">
              {t('twoFactor.setup')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}