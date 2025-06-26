'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  organization: {
    name: string;
    slug: string;
  };
}

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          プロフィールが正常に更新されました
        </div>
      )}

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
        <Label htmlFor="organization">所属組織</Label>
        <Input id="organization" value={user.organization.name} disabled className="bg-muted" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !name}>
          {loading ? '更新中...' : 'プロフィールを更新'}
        </Button>
      </div>
    </form>
  );
}
