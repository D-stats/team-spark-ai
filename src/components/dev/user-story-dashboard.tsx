/**
 * ユーザーストーリー検証ダッシュボード
 * 開発環境でのみ表示
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  GitBranch,
  TestTube,
} from 'lucide-react';
import { UserStory, StoryValidation, StoryStatus, StoryPriority } from '@/lib/user-stories/types';
import { StoryValidator } from '@/lib/user-stories/validator';
import { cn } from '@/lib/utils';

export function UserStoryDashboard() {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [validations, setValidations] = useState<StoryValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  // Show only in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const loadStories = async () => {
    setLoading(true);
    try {
      // ストーリーをインポート
      const { evaluationStories, kudosStories } = await import(
        '@/lib/user-stories/stories/evaluation-stories'
      );
      const allStories = [...evaluationStories, ...kudosStories];
      setStories(allStories);

      // 検証を実行
      const validator = new StoryValidator();
      const result = validator.validateStories(allStories);
      setValidations(result.details);
    } catch (error) {
      // Error loading stories
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: StoryStatus) => {
    switch (status) {
      case StoryStatus.DONE:
        return 'text-green-600';
      case StoryStatus.IN_PROGRESS:
        return 'text-blue-600';
      case StoryStatus.TESTING:
        return 'text-purple-600';
      case StoryStatus.BLOCKED:
        return 'text-red-600';
      case StoryStatus.READY:
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: StoryPriority) => {
    const variants: Record<StoryPriority, 'destructive' | 'default' | 'secondary' | 'outline'> = {
      [StoryPriority.P0]: 'destructive',
      [StoryPriority.P1]: 'default',
      [StoryPriority.P2]: 'secondary',
      [StoryPriority.P3]: 'outline',
    };

    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  // Statistics calculations - optimized with useMemo
  const { validStories, totalStories, overallProgress } = useMemo(() => {
    const validCount = validations.filter((v) => v.isValid).length;
    const total = stories.length;
    const progress = total > 0 ? (validCount / total) * 100 : 0;
    return {
      validStories: validCount,
      totalStories: total,
      overallProgress: progress,
    };
  }, [validations, stories]);

  // Epic別にグループ化 - optimized with useMemo
  const storiesByEpic = useMemo(
    () =>
      stories.reduce(
        (acc, story) => {
          const epic = story.epicId || 'その他';
          if (!acc[epic]) acc[epic] = [];
          acc[epic].push(story);
          return acc;
        },
        {} as Record<string, UserStory[]>,
      ),
    [stories],
  );

  // Filtered stories - optimized with useMemo
  const filteredStories = useMemo(
    () =>
      selectedEpic ? stories.filter((s) => (s.epicId || 'その他') === selectedEpic) : stories,
    [stories, selectedEpic],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ユーザーストーリー検証</h2>
          <p className="text-gray-600">機能の実装状況とテストカバレッジ</p>
        </div>

        <Button onClick={loadStories} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>再検証</span>
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">総ストーリー数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">完了</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{validStories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">進行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stories.filter((s) => s.status === StoryStatus.IN_PROGRESS).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">進捗率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Epic フィルター */}
      <div className="flex space-x-2">
        <Button
          variant={selectedEpic === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedEpic(null)}
        >
          すべて
        </Button>
        {Object.keys(storiesByEpic).map((epic) => (
          <Button
            key={epic}
            variant={selectedEpic === epic ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEpic(epic)}
          >
            {epic} ({storiesByEpic[epic]?.length ?? 0})
          </Button>
        ))}
      </div>

      {/* ストーリー一覧 */}
      <div className="space-y-4">
        {filteredStories.map((story, _index) => {
          const validation = validations[stories.indexOf(story)];
          const isValid = validation?.isValid;

          return (
            <Card
              key={story.id}
              className={cn('transition-all', isValid ? 'border-green-200' : 'border-gray-200')}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {isValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : story.status === StoryStatus.IN_PROGRESS ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}

                    <div>
                      <CardTitle className="text-lg">
                        {story.id}: {story.title}
                      </CardTitle>
                      <p className="mt-1 text-sm text-gray-600">
                        As a <strong>{story.asA}</strong>, I want to{' '}
                        <strong>{story.iWantTo}</strong>, so that <strong>{story.soThat}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(story.priority)}
                    <Badge className={getStatusColor(story.status)}>{story.status}</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 受け入れ基準の進捗 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>受け入れ基準</span>
                    <span>
                      {validation?.completedCriteria || 0}/{validation?.totalCriteria || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((validation?.completedCriteria || 0) / (validation?.totalCriteria || 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                {/* 実装状況 */}
                <div className="grid gap-4 text-sm md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>コンポーネント: {story.implementedIn?.components?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4 text-gray-500" />
                    <span>API: {story.implementedIn?.apis?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-4 w-4 text-gray-500" />
                    <span>テスト: {story.implementedIn?.tests?.length || 0}</span>
                  </div>
                </div>

                {/* エラー表示 */}
                {validation?.missingImplementation &&
                  validation.missingImplementation.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">実装が不足しています:</div>
                        <ul className="mt-1 list-inside list-disc text-sm">
                          {validation.missingImplementation.map((missing, i) => (
                            <li key={i}>{missing}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                {/* タグ */}
                {story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {story.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
