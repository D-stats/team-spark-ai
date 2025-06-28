'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface KudosFormProps {
  users: User[];
}

const kudosCategories = [
  { value: 'TEAMWORK', label: 'チームワーク', color: 'bg-blue-100 text-blue-800' },
  { value: 'INNOVATION', label: 'イノベーション', color: 'bg-purple-100 text-purple-800' },
  { value: 'LEADERSHIP', label: 'リーダーシップ', color: 'bg-green-100 text-green-800' },
  { value: 'PROBLEM_SOLVING', label: '問題解決', color: 'bg-orange-100 text-orange-800' },
  { value: 'CUSTOMER_FOCUS', label: '顧客志向', color: 'bg-pink-100 text-pink-800' },
  { value: 'LEARNING', label: '学習・成長', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'OTHER', label: 'その他', color: 'bg-gray-100 text-gray-800' },
];

export function KudosForm({ users }: KudosFormProps): JSX.Element {
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kudos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId,
          message,
          category,
          isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Kudosの送信に失敗しました');
      }

      // フォームをリセット
      setReceiverId('');
      setMessage('');
      setCategory('');
      setIsPublic(true);

      // ページをリフレッシュして新しいKudosを表示
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = kudosCategories.find((cat) => cat.value === category) ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error !== null && error !== '' ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="receiver">送信先</Label>
        <Select value={receiverId} onValueChange={setReceiverId} required>
          <SelectTrigger>
            <SelectValue placeholder="チームメンバーを選択" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center space-x-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span>{user.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">カテゴリ</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {kudosCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <Badge variant="secondary" className={cat.color}>
                  {cat.label}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory ? (
          <Badge variant="secondary" className={selectedCategory.color}>
            {selectedCategory.label}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">メッセージ</Label>
        <Textarea
          id="message"
          placeholder="感謝のメッセージを入力してください..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={loading}
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isPublic" className="text-sm">
          チーム全体に公開する
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !receiverId || !message || !category}
      >
        {loading ? 'Kudosを送信中...' : 'Kudosを送信'}
      </Button>
    </form>
  );
}
