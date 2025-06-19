/**
 * 評価フォーム - 確認・送信ステップ
 * 入力内容の最終確認と送信
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  User,
  Target,
  BookOpen,
  MessageSquare,
  Award
} from 'lucide-react';
import { useEvaluationStore } from '@/stores/evaluation.store';
import { EvaluationWithDetails } from '@/types/api';
import { cn } from '@/lib/utils';

interface EvaluationReviewStepProps {
  evaluation: EvaluationWithDetails;
  isReadOnly?: boolean;
}

const ratingLabels = {
  1: { label: '要改善', color: 'text-red-600' },
  2: { label: '改善の余地あり', color: 'text-orange-600' },
  3: { label: '期待通り', color: 'text-yellow-600' },
  4: { label: '期待以上', color: 'text-blue-600' },
  5: { label: '卓越', color: 'text-green-600' },
};

export function EvaluationReviewStep({ 
  evaluation, 
  isReadOnly = false 
}: EvaluationReviewStepProps) {
  const {
    formData,
    canSubmit,
    errors,
  } = useEvaluationStore();

  // 入力完了状況をチェック
  const requiredFields = [
    { key: 'overallRating', label: '総合評価', icon: Star },
    { key: 'overallComments', label: '総合コメント', icon: MessageSquare },
    { key: 'competencyRatings', label: 'コンピテンシー評価', icon: Award },
  ];

  const completionStatus = requiredFields.map(field => ({
    ...field,
    isCompleted: field.key === 'competencyRatings' 
      ? Object.keys(formData.competencyRatings).length > 0 &&
        Object.values(formData.competencyRatings).every(rating => 
          rating.rating && rating.comments?.trim() && rating.behaviors.length > 0
        )
      : !!formData[field.key as keyof typeof formData],
  }));

  const allRequired = completionStatus.every(status => status.isCompleted);

  return (
    <div className="space-y-6">
      {/* 送信前チェック */}
      <Card className={cn(
        'border-2',
        allRequired ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
      )}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {allRequired ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            <span>入力完了状況</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completionStatus.map((status) => (
              <div key={status.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <status.icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{status.label}</span>
                </div>
                <Badge variant={status.isCompleted ? 'default' : 'secondary'}>
                  {status.isCompleted ? '完了' : '未完了'}
                </Badge>
              </div>
            ))}
          </div>
          
          {!allRequired && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                すべての必須項目を入力してから送信してください。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 評価サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>評価サマリー</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 評価対象者情報 */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {evaluation.evaluatee.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{evaluation.evaluatee.name}</h3>
              <p className="text-sm text-gray-600">{evaluation.evaluatee.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">
                  {evaluation.evaluatee.role === 'ADMIN' ? '管理者' :
                   evaluation.evaluatee.role === 'MANAGER' ? 'マネージャー' : 'メンバー'}
                </Badge>
                <Badge variant="outline">
                  {evaluation.cycle.name}
                </Badge>
              </div>
            </div>
          </div>

          {/* 総合評価 */}
          {formData.overallRating && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>総合評価</span>
              </h4>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-6 w-6',
                        i < formData.overallRating!
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {formData.overallRating}/5
                  </div>
                  <div className={cn(
                    'text-sm',
                    ratingLabels[formData.overallRating as keyof typeof ratingLabels]?.color
                  )}>
                    {ratingLabels[formData.overallRating as keyof typeof ratingLabels]?.label}
                  </div>
                </div>
              </div>

              {formData.overallComments && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">総合コメント</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.overallComments}
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* コンピテンシー評価サマリー */}
          {Object.keys(formData.competencyRatings).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>コンピテンシー評価</span>
              </h4>
              
              <div className="space-y-3">
                {Object.values(formData.competencyRatings).map((rating) => (
                  <div key={rating.competencyId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">コンピテンシー ID: {rating.competencyId}</h5>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < (rating.rating || 0)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {rating.rating}/5
                        </span>
                      </div>
                    </div>
                    
                    {rating.behaviors.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">
                          選択された行動指標: {rating.behaviors.length}項目
                        </span>
                      </div>
                    )}
                    
                    {rating.comments && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {rating.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* 目標・開発計画 */}
          {(formData.careerGoals || formData.developmentPlan) && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>目標・開発計画</span>
              </h4>
              
              {formData.careerGoals && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium mb-2 flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span>キャリア目標</span>
                  </h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.careerGoals}
                  </p>
                </div>
              )}

              {formData.developmentPlan && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h5 className="font-medium mb-2 flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span>開発計画</span>
                  </h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.developmentPlan}
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* 強み・改善点 */}
          {(formData.strengths || formData.improvements) && (
            <div className="space-y-3">
              <h4 className="font-semibold">追加フィードバック</h4>
              
              {formData.strengths && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium mb-2 text-green-800">強み・優れた点</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.strengths}
                  </p>
                </div>
              )}

              {formData.improvements && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h5 className="font-medium mb-2 text-orange-800">改善点・成長領域</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.improvements}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 送信に関する注意事項 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-amber-900 mb-2">📋 送信前の確認事項</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• 入力内容に誤りがないことを確認してください</li>
            <li>• 送信後は内容の修正ができません</li>
            <li>• 評価内容は適切な関係者のみが閲覧できます</li>
            <li>• 送信後、自動的に関係者に通知メールが送信されます</li>
          </ul>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            入力に不備があります。各項目を確認してください。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}