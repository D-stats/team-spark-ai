'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProfileData {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  bio: string;
  skills: string[];
  timezone: string;
  phoneNumber: string;
  linkedinUrl: string;
  twitterUrl: string;
  githubUrl: string;
  personalWebsite: string;
  startDate: string;
  avatarUrl: string;
}

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'Eastern Time (GMT-5)' },
  { value: 'America/Chicago', label: 'Central Time (GMT-6)' },
  { value: 'America/Denver', label: 'Mountain Time (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (GMT-8)' },
  { value: 'Asia/Tokyo', label: 'Japan Time (GMT+9)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT+0)' },
  { value: 'Europe/Paris', label: 'Central European Time (GMT+1)' },
  { value: 'Asia/Shanghai', label: 'China Time (GMT+8)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (GMT+10)' },
];

export function EnhancedProfileForm() {
  const t = useTranslations('settings.profile');
  const tCommon = useTranslations('common');
  const { user, refreshUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    timezone: user?.timezone || 'UTC',
    phoneNumber: user?.phoneNumber || '',
    linkedinUrl: user?.linkedinUrl || '',
    twitterUrl: user?.twitterUrl || '',
    githubUrl: user?.githubUrl || '',
    personalWebsite: user?.personalWebsite || '',
    startDate: user?.startDate ? format(new Date(user.startDate), 'yyyy-MM-dd') : '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('validation.invalidFileType'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('validation.fileSizeLimit'));
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const result = await response.json();
      
      setProfileData(prev => ({ ...prev, avatarUrl: result.avatarUrl }));
      toast.success(t('avatar.uploadSuccess'));
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(t('avatar.uploadError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar');
      }

      setProfileData(prev => ({ ...prev, avatarUrl: '' }));
      toast.success(t('avatar.removeSuccess'));
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error(t('avatar.removeError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          startDate: profileData.startDate ? new Date(profileData.startDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await refreshUser();
      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatarUrl} alt={profileData.name} />
              <AvatarFallback className="text-lg">
                {getUserInitials(profileData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label>{t('avatar')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('uploadAvatar')}
                </Button>
                {profileData.avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('removeAvatar')}
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                value={profileData.email}
                readOnly
                className="bg-muted"
                title={t('emailReadonly')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t('jobTitle')}</Label>
              <Input
                id="jobTitle"
                value={profileData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder={t('jobTitlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">{t('department')}</Label>
              <Input
                id="department"
                value={profileData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder={t('departmentPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('phoneNumber')}</Label>
              <Input
                id="phoneNumber"
                value={profileData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder={t('phoneNumberPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t('timezone')}</Label>
              <Select
                value={profileData.timezone}
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('timezonePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">{t('startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={profileData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio')}</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder={t('bioPlaceholder')}
              rows={4}
            />
          </div>

          {/* Skills Section */}
          <div className="space-y-2">
            <Label>{t('skills')}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profileData.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleSkillInputKeyDown}
                placeholder={t('skillsPlaceholder')}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t('social')}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">{t('linkedinUrl')}</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={profileData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterUrl">{t('twitterUrl')}</Label>
                <Input
                  id="twitterUrl"
                  type="url"
                  value={profileData.twitterUrl}
                  onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl">{t('githubUrl')}</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={profileData.githubUrl}
                  onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalWebsite">{t('personalWebsite')}</Label>
                <Input
                  id="personalWebsite"
                  type="url"
                  value={profileData.personalWebsite}
                  onChange={(e) => handleInputChange('personalWebsite', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isLoading || isUploadingAvatar}>
              {isLoading ? tCommon('loading') : tCommon('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}