'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

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
        throw new Error(errorData.error ?? 'プロフィールの更新に失敗しました');
      }

      setSuccess(true);
      router.refresh();
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
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          プロフィールが正常に更新されました
        </div>
      ) : null}

      {/* 基本情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本情報</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">氏名 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">メールアドレスは変更できません</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">電話番号</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              placeholder="090-1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">権限</Label>
            <Input
              id="role"
              value={
                user.role === 'ADMIN'
                  ? '管理者'
                  : user.role === 'MANAGER'
                    ? 'マネージャー'
                    : 'メンバー'
              }
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">権限は管理者によって設定されます</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">自己紹介</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            placeholder="あなたについて簡単に紹介してください..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">{bio.length}/500文字</p>
        </div>
      </div>

      {/* スキル */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">スキル</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="スキルを追加..."
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
          <p className="text-xs text-muted-foreground">{skills.length}/20個のスキル</p>
        </div>
      </div>

      {/* 言語・地域設定 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">言語・地域設定</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locale">言語</Label>
            <Select value={locale} onValueChange={setLocale} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">タイムゾーン</Label>
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

      {/* ソーシャルリンク */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">ソーシャルリンク</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              disabled={loading}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input
              id="githubUrl"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={loading}
              placeholder="https://github.com/yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter</Label>
            <Input
              id="twitterUrl"
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              disabled={loading}
              placeholder="https://twitter.com/yourusername"
            />
          </div>
        </div>
      </div>

      {/* 組織情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">組織情報</h3>
        <div className="space-y-2">
          <Label htmlFor="organization">所属組織</Label>
          <Input id="organization" value={user.organization.name} disabled className="bg-muted" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !name}>
          {loading ? '更新中...' : 'プロフィールを更新'}
        </Button>
      </div>
    </form>
  );
}
