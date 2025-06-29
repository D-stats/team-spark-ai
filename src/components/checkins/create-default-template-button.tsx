'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function CreateDefaultTemplateButton(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateDefault = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkin-templates/ensure-default', {
        method: 'POST',
      });

      if (response.ok) {
        // ページをリロードしてテンプレートを表示
        window.location.reload();
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error ?? 'デフォルトテンプレートの作成に失敗しました');
      }
    } catch (error) {
      alert('デフォルトテンプレートの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCreateDefault} disabled={isLoading} className="flex items-center gap-2">
      <Sparkles className="h-4 w-4" />
      {isLoading ? '作成中...' : 'デフォルトテンプレートを作成'}
    </Button>
  );
}
