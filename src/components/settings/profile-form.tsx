'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  bio?: string | null;
  skills?: string[];
  timezone?: string | null;
  locale?: string | null;
  phoneNumber?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  organization: {
    name: string;
    slug: string;
  };
}

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps): JSX.Element {
  const t = useTranslations('settings.profile');
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [skills, setSkills] = useState<string[]>(user.skills ?? []);
  const [newSkill, setNewSkill] = useState('');
  const [timezone, setTimezone] = useState(user.timezone ?? 'UTC');
  const [locale, setLocale] = useState(user.locale ?? 'ja');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? '');
  const [githubUrl, setGithubUrl] = useState(user.githubUrl ?? '');
  const [twitterUrl, setTwitterUrl] = useState(user.twitterUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Track the current locale for redirect detection
  const currentLocale = pathname.split('/')[1] || 'en';

  const timezones = [
    'UTC',
    'Asia/Tokyo',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Australia/Sydney',
  ];

  const addSkill = (): void => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 20) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string): void => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
          skills,
          timezone,
          locale,
          phoneNumber,
          linkedinUrl,
          githubUrl,
          twitterUrl,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? t('error'));
      }

      setSuccess(true);
      
      // If locale changed from the original user locale, redirect to new locale URL
      // This handles both cases: changing locale and correcting URL to match user's actual locale
      if (locale !== currentLocale) {
        const newPath = pathname.replace(`/${currentLocale}/`, `/${locale}/`);
        console.log('Language changed:', { currentLocale, newLocale: locale, currentPath: pathname, newPath });
        // Use window.location to ensure a full reload with the new locale
        window.location.href = newPath;
      } else {
        console.log('Language not changed, refreshing:', { currentLocale, locale });
        router.refresh();
      }
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
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{t('success')}</div>
      ) : null}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('basicInfo')}</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t('nameLabel')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">{t('emailNotEditable')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{t('phoneLabel')}</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('roleLabel')}</Label>
            <Input
              id="role"
              value={
                user.role === 'ADMIN'
                  ? t('roleAdmin')
                  : user.role === 'MANAGER'
                    ? t('roleManager')
                    : t('roleMember')
              }
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">{t('roleNotEditable')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">{t('bioLabel')}</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            placeholder={t('bioPlaceholder')}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {t('bioCharCount', { current: bio.length, max: 500 })}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('skillsLabel')}</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder={t('addSkillPlaceholder')}
              disabled={loading || skills.length >= 20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSkill}
              disabled={!newSkill.trim() || skills.length >= 20 || loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => removeSkill(skill)}
                  disabled={loading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('skillsCount', { current: skills.length, max: 20 })}
          </p>
        </div>
      </div>

      {/* Language & Region Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('localeSettings')}</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locale">{t('localeLabel')}</Label>
            <Select value={locale} onValueChange={setLocale} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">{t('languageJa')}</SelectItem>
                <SelectItem value="en">{t('languageEn')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t('timezoneLabel')}</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('socialLinks')}</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">{t('linkedinLabel')}</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              disabled={loading}
              placeholder={t('linkedinPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubUrl">{t('githubLabel')}</Label>
            <Input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={loading}
              placeholder={t('githubPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterUrl">{t('twitterLabel')}</Label>
            <Input
              id="twitterUrl"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              disabled={loading}
              placeholder={t('twitterPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Organization Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('organizationInfo')}</h3>
        <div className="space-y-2">
          <Label htmlFor="organization">{t('organizationLabel')}</Label>
          <Input id="organization" value={user.organization.name} disabled className="bg-muted" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !name}>
          {loading ? t('updating') : t('updateButton')}
        </Button>
      </div>
    </form>
  );
}
