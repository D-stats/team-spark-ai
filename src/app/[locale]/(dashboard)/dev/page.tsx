/**
 * 開発者向けダッシュボード
 * 開発環境でのみアクセス可能
 */

import { redirect } from 'next/navigation';
import { UserStoryDashboard } from '@/components/dev/user-story-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function DevPage() {
  // 本番環境では404にリダイレクト
  if (process.env.NODE_ENV === 'production') {
    redirect('/404');
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center space-x-3">
        <Terminal className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">開発者ダッシュボード</h1>
      </div>

      <Alert>
        <AlertDescription>
          このページは開発環境でのみ表示されます。
          ユーザーストーリーの実装状況とテストカバレッジを確認できます。
        </AlertDescription>
      </Alert>

      {/* コマンド集 */}
      <Card>
        <CardHeader>
          <CardTitle>便利なコマンド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 font-mono text-sm">
            <div className="rounded bg-gray-100 p-3">
              <div className="text-gray-600"># ストーリー検証レポートの生成</div>
              <div>npm run validate:stories</div>
            </div>

            <div className="rounded bg-gray-100 p-3">
              <div className="text-gray-600"># ストーリーベースのテスト実行</div>
              <div>npm run test:stories</div>
            </div>

            <div className="rounded bg-gray-100 p-3">
              <div className="text-gray-600"># 型チェック</div>
              <div>npm run type-check</div>
            </div>

            <div className="rounded bg-gray-100 p-3">
              <div className="text-gray-600"># すべての検証を実行</div>
              <div>npm run validate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ユーザーストーリーダッシュボード */}
      <UserStoryDashboard />
    </div>
  );
}
