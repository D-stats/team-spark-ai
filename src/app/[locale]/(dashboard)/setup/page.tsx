'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetupPage() {
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  };

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setOrgName(name);
    setOrgSlug(generateSlug(name));
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '組織の作成に失敗しました');
      }

      await response.json();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">組織をセットアップ</CardTitle>
          <CardDescription>
            あなたの組織情報を入力して、TeamSpark AIの利用を開始しましょう
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSetup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgName">組織名</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="株式会社サンプル"
                value={orgName}
                onChange={handleOrgNameChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">組織ID（URL用）</Label>
              <Input
                id="orgSlug"
                type="text"
                placeholder="sample-company"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
                disabled={loading}
                pattern="[a-z0-9-]+"
                title="小文字、数字、ハイフンのみ使用可能"
              />
              <p className="text-xs text-muted-foreground">
                この識別子は後から変更できません
              </p>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" className="w-full" disabled={loading || !orgName || !orgSlug}>
              {loading ? '組織を作成中...' : '組織を作成'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}