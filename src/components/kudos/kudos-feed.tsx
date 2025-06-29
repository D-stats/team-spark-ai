'use client';

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Lock } from 'lucide-react';

interface Kudos {
  id: string;
  message: string;
  category: string;
  isPublic: boolean;
  createdAt: Date;
  sender: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  receiver: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface KudosFeedProps {
  kudos: Kudos[];
}

const kudosCategories = {
  TEAMWORK: { label: 'チームワーク', color: 'bg-blue-100 text-blue-800' },
  INNOVATION: { label: 'イノベーション', color: 'bg-purple-100 text-purple-800' },
  LEADERSHIP: { label: 'リーダーシップ', color: 'bg-green-100 text-green-800' },
  PROBLEM_SOLVING: { label: '問題解決', color: 'bg-orange-100 text-orange-800' },
  CUSTOMER_FOCUS: { label: '顧客志向', color: 'bg-pink-100 text-pink-800' },
  LEARNING: { label: '学習・成長', color: 'bg-indigo-100 text-indigo-800' },
  OTHER: { label: 'その他', color: 'bg-gray-100 text-gray-800' },
};

export function KudosFeed({ kudos }: KudosFeedProps): JSX.Element {
  if (kudos.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Heart className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p>まだKudosがありません</p>
        <p className="text-sm">チームメンバーに感謝を伝えてみましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {kudos.map((kudo) => {
        const categoryKey = kudo.category as keyof typeof kudosCategories;
        const category =
          categoryKey in kudosCategories ? kudosCategories[categoryKey] : kudosCategories.OTHER;

        return (
          <Card key={kudo.id} className="border-l-4 border-l-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {kudo.sender.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center space-x-2">
                      <span className="text-sm font-medium">{kudo.sender.name}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm font-medium">{kudo.receiver.name}</span>
                      {!kudo.isPublic && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className="mb-2 text-sm text-foreground">{kudo.message}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={category.color}>
                        {category.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(kudo.createdAt), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
