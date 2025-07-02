'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';

interface User {
  id: string;
  lastPasswordChange?: Date | null;
  twoFactorEnabled?: boolean;
}

interface PasswordSettingsProps {
  user: User;
}

export function PasswordSettings({ user }: PasswordSettingsProps): JSX.Element {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'パスワードの更新に失敗しました');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (
    password: string,
  ): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 2) return { score, label: '弱い', color: 'bg-red-500' };
    if (score <= 3) return { score, label: '普通', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: '強い', color: 'bg-green-500' };
    return { score, label: '非常に強い', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            パスワード変更
          </CardTitle>
          <CardDescription>
            セキュリティを保つため定期的にパスワードを変更してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.lastPasswordChange && (
            <div className="mb-4 rounded-md bg-muted p-3 text-sm">
              前回のパスワード変更: {new Date(user.lastPasswordChange).toLocaleDateString('ja-JP')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error !== null && error !== '' ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                パスワードが正常に更新されました
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="current-password">現在のパスワード</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={loading}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• 8文字以上</li>
                    <li>• 大文字・小文字・数字を含む</li>
                    <li>• 特殊文字を含むとより安全</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">パスワードが一致しません</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  passwordStrength.score < 3
                }
              >
                {loading ? '更新中...' : 'パスワードを更新'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            セキュリティ情報
          </CardTitle>
          <CardDescription>アカウントのセキュリティ状態を確認できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">二要素認証</p>
              <p className="text-sm text-muted-foreground">
                追加のセキュリティ層でアカウントを保護
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user.twoFactorEnabled === true ? (
                <span className="text-sm font-medium text-green-600">有効</span>
              ) : (
                <span className="text-sm text-muted-foreground">無効</span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              セキュリティの詳細設定については、システム管理者にお問い合わせください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
