'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BillingInfo from './BillingInfo';
import { OrganizationLogoUpload } from './OrganizationLogoUpload';

interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  settings: any;
  createdAt: Date;
  _count: {
    users: number;
    teams: number;
  };
}

interface Stats {
  totalUsers: number;
  totalTeams: number;
  activeUsers: number;
  recentLogins: number;
}

interface OrganizationManagementProps {
  organization: Organization;
  stats: Stats;
}

export default function OrganizationManagement({ organization, stats }: OrganizationManagementProps) {
  const t = useTranslations('admin.organization');
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState(organization.settings || {});
  const [currentOrganization, setCurrentOrganization] = useState(organization);

  const handleUpdateOrganization = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/organization', {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        toast({
          title: t('update.success'),
          description: t('update.successDesc')
        });
        setIsEditing(false);
        window.location.reload();
      } else {
        throw new Error('Failed to update organization');
      }
    } catch (error) {
      toast({
        title: t('update.error'),
        description: t('update.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      const response = await fetch('/api/admin/organization/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        toast({
          title: t('settings.success'),
          description: t('settings.successDesc')
        });
        setSettings(newSettings);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: t('settings.error'),
        description: t('settings.errorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleLogoUpdate = (logoUrl: string | null) => {
    setCurrentOrganization(prev => ({ ...prev, logoUrl }));
  };

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>{t('overview.title')}</span>
            </CardTitle>
            <Button
              variant={isEditing ? 'default' : 'outline'}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? t('actions.save') : t('actions.edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form action={handleUpdateOrganization} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('form.name')}</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={organization.name}
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">{t('form.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">{t('info.name')}</h3>
                <p className="text-gray-600">{organization.name}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('info.created')}</h3>
                <p className="text-gray-600">{new Date(organization.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('info.id')}</h3>
                <p className="text-gray-600 font-mono text-sm">{organization.id}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.activeUsers')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% {t('stats.activeRate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalTeams')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.recentLogins')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentLogins}</div>
            <p className="text-xs text-muted-foreground">{t('stats.last30Days')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t('settings.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">{t('settings.tabs.features')}</TabsTrigger>
              <TabsTrigger value="branding">{t('settings.tabs.branding')}</TabsTrigger>
              <TabsTrigger value="billing">{t('settings.tabs.billing')}</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="kudos">{t('settings.features.kudos')}</Label>
                  <Switch
                    id="kudos"
                    checked={settings.features?.kudos ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        features: { ...settings.features, kudos: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="surveys">{t('settings.features.surveys')}</Label>
                  <Switch
                    id="surveys"
                    checked={settings.features?.surveys ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        features: { ...settings.features, surveys: checked }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="checkins">{t('settings.features.checkins')}</Label>
                  <Switch
                    id="checkins"
                    checked={settings.features?.checkins ?? true}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        features: { ...settings.features, checkins: checked }
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={() => handleUpdateSettings(settings)}>
                {t('settings.save')}
              </Button>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <div className="space-y-6">
                {/* Organization Logo Upload */}
                <OrganizationLogoUpload
                  organization={currentOrganization}
                  onLogoUpdate={handleLogoUpdate}
                />

                {/* Other Branding Settings */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">{t('settings.branding.primaryColor')}</Label>
                    <Input
                      type="color"
                      id="primaryColor"
                      value={settings.branding?.primaryColor || '#000000'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          branding: { ...settings.branding, primaryColor: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={() => handleUpdateSettings(settings)}>
                  {t('settings.save')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <BillingInfo />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}