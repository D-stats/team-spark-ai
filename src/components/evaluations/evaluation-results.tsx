/**
 * 評価結果表示コンポーネント
 * 提出済み・承認済み評価の結果を表示
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  User,
  Calendar,
  MessageSquare,
  Award,
  Target,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { EvaluationWithDetails } from '@/types/api';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface EvaluationResultsProps {
  evaluation: EvaluationWithDetails;
  onReview?: (approved: boolean, comments?: string) => void;
  onShare?: () => void;
  isLoading?: boolean;
}

const ratingLabels = {
  1: { label: '要改善', color: 'text-red-600' },
  2: { label: '改善の余地あり', color: 'text-orange-600' },
  3: { label: '期待通り', color: 'text-yellow-600' },
  4: { label: '期待以上', color: 'text-blue-600' },
  5: { label: '卓越', color: 'text-green-600' },
};

const categoryLabels = {
  CORE: 'コア・コンピテンシー',
  LEADERSHIP: 'リーダーシップ',
  TECHNICAL: 'テクニカル',
  BEHAVIORAL: '行動特性',
};

export function EvaluationResults({ 
  evaluation, 
  onReview, 
  onShare, 
  isLoading = false 
}: EvaluationResultsProps) {
  const { user } = useUser();
  const [reviewComments, setReviewComments] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // 権限チェック
  const canReview = user && (user.role === 'ADMIN' || user.role === 'MANAGER') && 
                   evaluation.status === 'SUBMITTED';
  const canShare = user && (user.role === 'ADMIN' || user.role === 'MANAGER') && 
                  evaluation.status === 'REVIEWED';
  const canView = user && (
    user.id === evaluation.evaluateeId || 
    user.id === evaluation.evaluatorId || 
    user.role === 'ADMIN' || 
    user.role === 'MANAGER'
  );

  // 権限がない場合は何も表示しない
  if (!canView) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          この評価を閲覧する権限がありません。
        </AlertDescription>
      </Alert>
    );
  }

  // コンピテンシー評価をカテゴリ別にグループ化
  const competenciesByCategory = evaluation.competencyRatings.reduce((acc, rating) => {
    const category = rating.competency.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(rating);
    return acc;
  }, {} as Record<string, typeof evaluation.competencyRatings>);

  const handleReview = (approved: boolean) => {
    if (onReview) {
      onReview(approved, reviewComments);
      setShowReviewForm(false);
      setReviewComments('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">評価結果</CardTitle>
              <p className="text-gray-600 mt-1">
                {evaluation.cycle.name} - {evaluation.evaluatee.name}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* ステータス */}
              <Badge variant={
                evaluation.status === 'DRAFT' ? 'secondary' :
                evaluation.status === 'SUBMITTED' ? 'default' :
                evaluation.status === 'REVIEWED' ? 'outline' : 'default'
              }>
                {evaluation.status === 'DRAFT' ? '下書き' :
                 evaluation.status === 'SUBMITTED' ? '提出済み' :
                 evaluation.status === 'REVIEWED' ? '承認済み' :
                 evaluation.status === 'SHARED' ? '共有済み' : evaluation.status}
              </Badge>

              {/* 可視性 */}
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                {evaluation.isVisible ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>公開</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>非公開</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* タイムライン */}
          <div className="grid md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">作成日</div>
                <div className="text-xs text-gray-600">
                  {new Date(evaluation.createdAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            </div>

            {evaluation.submittedAt && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">提出日</div>
                  <div className="text-xs text-gray-600">
                    {new Date(evaluation.submittedAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </div>
            )}

            {evaluation.reviewedAt && (
              <div className="flex items-center space-x-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium">承認日</div>
                  <div className="text-xs text-gray-600">
                    {new Date(evaluation.reviewedAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* アクションボタン */}
      {(canReview || canShare) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">管理者アクション</h3>
              
              <div className="flex space-x-3">
                {canReview && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      disabled={isLoading}
                    >
                      レビュー
                    </Button>
                  </>
                )}
                
                {canShare && (
                  <Button
                    onClick={onShare}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>従業員に共有</span>
                  </Button>
                )}
              </div>
            </div>

            {/* レビューフォーム */}
            {showReviewForm && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">レビューコメント（任意）</label>
                    <textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="承認・差し戻しの理由を記述してください..."
                      className="w-full mt-1 p-2 border rounded-md text-sm"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleReview(true)}
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>承認</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleReview(false)}
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>差し戻し</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setShowReviewForm(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 評価者・被評価者情報 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>被評価者</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {evaluation.evaluatee.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{evaluation.evaluatee.name}</h3>
                <p className="text-sm text-gray-600">{evaluation.evaluatee.email}</p>
                <Badge variant="outline" className="mt-1">
                  {evaluation.evaluatee.role === 'ADMIN' ? '管理者' :
                   evaluation.evaluatee.role === 'MANAGER' ? 'マネージャー' : 'メンバー'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>評価者</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold">
                  {evaluation.evaluator.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{evaluation.evaluator.name}</h3>
                <p className="text-sm text-gray-600">{evaluation.evaluator.email}</p>
                <Badge variant="outline" className="mt-1">
                  {evaluation.type === 'SELF' ? '自己評価' :
                   evaluation.type === 'MANAGER' ? '上司評価' :
                   evaluation.type === 'PEER' ? '同僚評価' : evaluation.type}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 総合評価 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>総合評価</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {evaluation.overallRating && (
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-6 w-6',
                      i < evaluation.overallRating!
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {evaluation.overallRating}/5
                </div>
                <div className={cn(
                  'text-sm',
                  ratingLabels[evaluation.overallRating as keyof typeof ratingLabels]?.color
                )}>
                  {ratingLabels[evaluation.overallRating as keyof typeof ratingLabels]?.label}
                </div>
              </div>
            </div>
          )}

          {evaluation.overallComments && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium mb-2">総合コメント</h5>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {evaluation.overallComments}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* コンピテンシー評価 */}
      {Object.keys(competenciesByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <span>コンピテンシー評価</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(competenciesByCategory).map(([category, ratings]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-base border-b pb-2">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">{rating.competency.name}</h5>
                          <p className="text-sm text-gray-600">{rating.competency.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < rating.rating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{rating.rating}/5</span>
                        </div>
                      </div>

                      {rating.behaviors.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium mb-1">該当する行動指標:</h6>
                          <div className="flex flex-wrap gap-1">
                            {rating.behaviors.map((behavior, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {behavior}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {rating.comments && (
                        <div className="mb-3 p-3 bg-gray-50 rounded">
                          <h6 className="text-sm font-medium mb-1">評価コメント:</h6>
                          <p className="text-sm text-gray-700">{rating.comments}</p>
                        </div>
                      )}

                      {rating.examples && (
                        <div className="mb-3 p-3 bg-blue-50 rounded">
                          <h6 className="text-sm font-medium mb-1">具体的な事例:</h6>
                          <p className="text-sm text-gray-700">{rating.examples}</p>
                        </div>
                      )}

                      {rating.improvementAreas && (
                        <div className="p-3 bg-orange-50 rounded">
                          <h6 className="text-sm font-medium mb-1">改善・成長領域:</h6>
                          <p className="text-sm text-gray-700">{rating.improvementAreas}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 追加フィードバック */}
      {(evaluation.strengths || evaluation.improvements) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>追加フィードバック</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluation.strengths && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h5 className="font-medium mb-2 text-green-800">強み・優れた点</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {evaluation.strengths}
                </p>
              </div>
            )}

            {evaluation.improvements && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h5 className="font-medium mb-2 text-orange-800">改善点・成長領域</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {evaluation.improvements}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 目標・開発計画 */}
      {(evaluation.careerGoals || evaluation.developmentPlan) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <span>目標・開発計画</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluation.careerGoals && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>キャリア目標</span>
                </h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {evaluation.careerGoals}
                </p>
              </div>
            )}

            {evaluation.developmentPlan && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span>開発計画</span>
                </h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {evaluation.developmentPlan}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* マネージャーコメント */}
      {evaluation.managerComments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span>マネージャーコメント</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {evaluation.managerComments}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}