import { Suspense } from 'react';
import { CheckInTemplateManager } from '@/components/checkins/template-manager';

export default function CheckInTemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">チェックインテンプレート管理</h1>
        <p className="mt-2 text-gray-600">組織のチェックイン頻度と質問をカスタマイズできます</p>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <CheckInTemplateManager />
      </Suspense>
    </div>
  );
}
