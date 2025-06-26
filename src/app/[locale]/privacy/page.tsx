import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Globe, Database, Cookie, Info } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
          <Shield className="h-8 w-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-6">
        {/* Language Preference Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('languagePreferences.title')}
            </CardTitle>
            <CardDescription>{t('languagePreferences.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold">
                  <Database className="h-4 w-4" />
                  {t('languagePreferences.howWeStore')}
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>{t('languagePreferences.localStorage')}</li>
                  <li>{t('languagePreferences.noCookies')}</li>
                  <li>{t('languagePreferences.clientSideOnly')}</li>
                  <li>{t('languagePreferences.noServerStorage')}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">{t('languagePreferences.whatWeStore')}</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>{t('languagePreferences.selectedLanguage')}</li>
                  <li>{t('languagePreferences.selectionDate')}</li>
                  <li>{t('languagePreferences.selectionMethod')}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">{t('languagePreferences.yourControl')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('languagePreferences.controlDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              {t('cookiePolicy.title')}
            </CardTitle>
            <CardDescription>{t('cookiePolicy.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="text-sm">
                  <p className="mb-1 font-semibold text-green-900 dark:text-green-100">
                    {t('cookiePolicy.noCookiesTitle')}
                  </p>
                  <p className="text-green-800 dark:text-green-200">
                    {t('cookiePolicy.noCookiesDescription')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('dataCollection.title')}
            </CardTitle>
            <CardDescription>{t('dataCollection.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">{t('dataCollection.teamData')}</h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>{t('dataCollection.teamMessages')}</li>
                  <li>{t('dataCollection.engagementMetrics')}</li>
                  <li>{t('dataCollection.performanceData')}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">{t('dataCollection.security')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('dataCollection.securityDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('contact.title')}</CardTitle>
            <CardDescription>{t('contact.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('contact.email')}: privacy@teamspark-ai.com
            </p>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-center text-sm text-muted-foreground">
          {t('lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
