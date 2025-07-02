'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface NotificationSettings {
  email: {
    kudos: boolean;
    checkins: boolean;
    okr: boolean;
    surveys: boolean;
    teamUpdates: boolean;
    evaluations: boolean;
  };
  inApp: {
    kudos: boolean;
    checkins: boolean;
    okr: boolean;
    surveys: boolean;
    teamUpdates: boolean;
    evaluations: boolean;
  };
  frequency: 'instant' | 'daily' | 'weekly' | 'never';
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email: {
    kudos: true,
    checkins: true,
    okr: true,
    surveys: true,
    teamUpdates: true,
    evaluations: true,
  },
  inApp: {
    kudos: true,
    checkins: true,
    okr: true,
    surveys: true,
    teamUpdates: true,
    evaluations: true,
  },
  frequency: 'instant',
};

export function EnhancedNotificationSettings() {
  const t = useTranslations('settings.notifications');
  const tCommon = useTranslations('common');
  const { user, refreshUser } = useUser();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.notificationSettings) {
      try {
        const userSettings = typeof user.notificationSettings === 'string' 
          ? JSON.parse(user.notificationSettings)
          : user.notificationSettings;
        
        setSettings({
          ...DEFAULT_SETTINGS,
          ...userSettings,
        });
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setIsLoading(false);
  }, [user]);

  const handleEmailToggle = (category: keyof NotificationSettings['email']) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [category]: !prev.email[category],
      },
    }));
  };

  const handleInAppToggle = (category: keyof NotificationSettings['inApp']) => {
    setSettings(prev => ({
      ...prev,
      inApp: {
        ...prev.inApp,
        [category]: !prev.inApp[category],
      },
    }));
  };

  const handleFrequencyChange = (frequency: NotificationSettings['frequency']) => {
    setSettings(prev => ({
      ...prev,
      frequency,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      await refreshUser();
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Notification settings update error:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const notificationCategories = [
    { key: 'kudos', title: t('categories.kudos.title'), description: t('categories.kudos.description') },
    { key: 'checkins', title: t('categories.checkins.title'), description: t('categories.checkins.description') },
    { key: 'okr', title: t('categories.okr.title'), description: t('categories.okr.description') },
    { key: 'surveys', title: t('categories.surveys.title'), description: t('categories.surveys.description') },
    { key: 'teamUpdates', title: t('categories.teamUpdates.title'), description: t('categories.teamUpdates.description') },
    { key: 'evaluations', title: t('categories.evaluations.title'), description: t('categories.evaluations.description') },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Frequency */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t('frequency.title')}</Label>
          <Select
            value={settings.frequency}
            onValueChange={(value: NotificationSettings['frequency']) => handleFrequencyChange(value)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">{t('frequency.instant')}</SelectItem>
              <SelectItem value="daily">{t('frequency.daily')}</SelectItem>
              <SelectItem value="weekly">{t('frequency.weekly')}</SelectItem>
              <SelectItem value="never">{t('frequency.never')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Notification Categories */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div></div>
            <div className="text-center">
              <Label className="font-semibold">{t('email')}</Label>
            </div>
            <div className="text-center">
              <Label className="font-semibold">{t('inApp')}</Label>
            </div>
          </div>

          {notificationCategories.map((category) => (
            <div key={category.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-1">
                <Label className="font-medium">{category.title}</Label>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              
              <div className="flex justify-center">
                <Switch
                  checked={settings.email[category.key as keyof NotificationSettings['email']]}
                  onCheckedChange={() => handleEmailToggle(category.key as keyof NotificationSettings['email'])}
                  disabled={settings.frequency === 'never'}
                />
              </div>
              
              <div className="flex justify-center">
                <Switch
                  checked={settings.inApp[category.key as keyof NotificationSettings['inApp']]}
                  onCheckedChange={() => handleInAppToggle(category.key as keyof NotificationSettings['inApp'])}
                />
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? tCommon('loading') : tCommon('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}