'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

interface CreateTeamDialogProps {
  users: User[];
}

export function CreateTeamDialog({ users }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          memberIds: selectedMembers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'チームの作成に失敗しました');
      }

      // フォームをリセット
      setName('');
      setDescription('');
      setSelectedMembers([]);
      setOpen(false);

      // ページをリフレッシュして新しいチームを表示
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const getSelectedUser = (userId: string) => users.find((user) => user.id === userId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          チーム作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しいチーム作成</DialogTitle>
          <DialogDescription>チーム名とメンバーを設定してください</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">チーム名 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 開発チーム"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="チームの役割や目的を説明してください..."
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>メンバー選択</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-muted"
                  onClick={() => toggleMember(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>選択済みメンバー ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((userId) => {
                  const user = getSelectedUser(userId);
                  if (!user) return null;
                  return (
                    <div
                      key={userId}
                      className="flex items-center space-x-1 rounded bg-primary/10 px-2 py-1 text-sm text-primary"
                    >
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleMember(userId)}
                        className="ml-1 rounded p-0.5 hover:bg-primary/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || !name} className="flex-1">
              {loading ? '作成中...' : 'チーム作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
