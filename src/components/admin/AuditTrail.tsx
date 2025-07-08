'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Monitor, Search, Download, Calendar, Clock, User } from 'lucide-react';

interface AuditLog {
  id: string;
  loginAt: Date;
  success: boolean;
  failReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: any;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActiveSession {
  id: string;
  sessionToken: string;
  deviceInfo?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  isActive: boolean;
  lastUsedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuditTrailProps {
  auditLogs: AuditLog[];
  activeSessions: ActiveSession[];
}

export default function AuditTrail({ auditLogs, activeSessions }: AuditTrailProps) {
  const t = useTranslations('admin.audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.ipAddress && log.ipAddress.includes(searchTerm));
    
    const matchesEvent = eventFilter === 'all' || 
                        (eventFilter === 'success' && log.success) ||
                        (eventFilter === 'failed' && !log.success);

    const now = new Date();
    let matchesDate = true;
    if (dateRange === 'today') {
      matchesDate = new Date(log.loginAt).toDateString() === now.toDateString();
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(log.loginAt) >= weekAgo;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = new Date(log.loginAt) >= monthAgo;
    }

    return matchesSearch && matchesEvent && matchesDate;
  });

  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_logs.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const getDeviceInfo = (deviceInfo: any) => {
    if (!deviceInfo) return t('session.unknownDevice');
    const parsed = typeof deviceInfo === 'string' ? JSON.parse(deviceInfo) : deviceInfo;
    return `${parsed.browser || 'Unknown'} on ${parsed.os || 'Unknown'}`;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="logs">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">{t('tabs.auditLogs')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('tabs.activeSessions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>{t('logs.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('logs.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.allEvents')}</SelectItem>
                    <SelectItem value="success">{t('filters.successOnly')}</SelectItem>
                    <SelectItem value="failed">{t('filters.failedOnly')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filters.allTime')}</SelectItem>
                    <SelectItem value="today">{t('filters.today')}</SelectItem>
                    <SelectItem value="week">{t('filters.thisWeek')}</SelectItem>
                    <SelectItem value="month">{t('filters.thisMonth')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportLogs} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t('actions.export')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('logs.empty')}</p>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div key={log.id} className={`p-4 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{log.user.name}</span>
                              <span className="text-sm text-gray-600">({log.user.email})</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(log.loginAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(log.loginAt).toLocaleTimeString()}</span>
                              </div>
                              {log.ipAddress && (
                                <span>IP: {log.ipAddress}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? t('logs.success') : t('logs.failed')}
                          </Badge>
                          {!log.success && log.failReason && (
                            <p className="text-xs text-red-600 mt-1">{log.failReason}</p>
                          )}
                          {log.userAgent && (
                            <p className="text-xs text-gray-500 mt-1">
                              {getDeviceInfo(log.deviceInfo)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>{t('sessions.title')}</span>
                </div>
                <Badge variant="secondary">
                  {t('sessions.active', { count: activeSessions.length })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('sessions.empty')}</p>
                  </div>
                ) : (
                  activeSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{session.user.name}</span>
                            <span className="text-sm text-gray-600">({session.user.email})</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>{getDeviceInfo(session.deviceInfo)}</span>
                            {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                            <span>{t('sessions.lastUsed')}: {new Date(session.lastUsedAt).toLocaleString()}</span>
                            <span>{t('sessions.expires')}: {new Date(session.expiresAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        {t('sessions.revoke')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}