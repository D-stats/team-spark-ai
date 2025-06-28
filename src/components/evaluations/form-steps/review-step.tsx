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
  Award,
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
  isReadOnly: _isReadOnly = false,
}: EvaluationReviewStepProps): JSX.Element {
  const { formData, errors } = useEvaluationStore();

  // 入力完了状況をチェック
  const requiredFields = [
    { key: 'overallRating', label: '総合評価', icon: Star },
    { key: 'overallComments', label: '総合コメント', icon: MessageSquare },
    { key: 'competencyRatings', label: 'コンピテンシー評価', icon: Award },
  ];

  const completionStatus = requiredFields.map((field) => ({
    ...field,
    isCompleted:
      field.key === 'competencyRatings'
        ? Object.keys(formData.competencyRatings).length > 0 &&
          Object.values(formData.competencyRatings).every(
            (rating) =>
              rating.rating !== null &&
              rating.rating !== undefined &&
              rating.comments !== undefined &&
              rating.comments.trim() !== '' &&
              rating.behaviors.length > 0,
          )
        : formData[field.key as keyof typeof formData] !== null &&
          formData[field.key as keyof typeof formData] !== undefined,
  }));

  const allRequired = completionStatus.every((status) => status.isCompleted);

  return (
    <div className="space-y-6">
      {/* 送信前チェック */}
      <Card
        className={cn(
          'border-2',
          allRequired ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50',
        )}
      >
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
              <AlertDescription>すべての必須項目を入力してから送信してください。</AlertDescription>
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
          <div className="flex items-center space-x-4 rounded-lg bg-gray-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="font-semibold text-blue-600">
                {evaluation.evaluatee.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{evaluation.evaluatee.name}</h3>
              <p className="text-sm text-gray-600">{evaluation.evaluatee.email}</p>
              <div className="mt-1 flex items-center space-x-2">
                <Badge variant="outline">
                  {evaluation.evaluatee.role === 'ADMIN'
                    ? '管理者'
                    : evaluation.evaluatee.role === 'MANAGER'
                      ? 'マネージャー'
                      : 'メンバー'}
                </Badge>
                <Badge variant="outline">{evaluation.cycle.name}</Badge>
              </div>
            </div>
          </div>

          {/* 総合評価 */}
          {formData.overallRating !== null && formData.overallRating !== undefined && (
            <div className="space-y-3">
              <h4 className="flex items-center space-x-2 font-semibold">
                <Star className="h-4 w-4" />
                <span>総合評価</span>
              </h4>

              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <div className="flex items-center">
                  {[...(Array(5) as unknown[])].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-6 w-6',
                        i < (formData.overallRating ?? 0)
                          ? 'fill-current text-yellow-500'
                          : 'text-gray-300',
                      )}
                    />
                  ))}
                </div>
                <div>
                  <div className="text-lg font-semibold">{formData.overallRating ?? 0}/5</div>
                  <div
                    className={cn(
                      'text-sm',
                      ratingLabels[(formData.overallRating ?? 0) as keyof typeof ratingLabels]
                        ?.color,
                    )}
                  >
                    {
                      ratingLabels[(formData.overallRating ?? 0) as keyof typeof ratingLabels]
                        ?.label
                    }
                  </div>
                </div>
              </div>

              {formData.overallComments !== null &&
                formData.overallComments !== undefined &&
                formData.overallComments !== '' && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h5 className="mb-2 font-medium">総合コメント</h5>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
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
              <h4 className="flex items-center space-x-2 font-semibold">
                <Award className="h-4 w-4" />
                <span>コンピテンシー評価</span>
              </h4>

              <div className="space-y-3">
                {Object.values(formData.competencyRatings).map((rating) => (
                  <div key={rating.competencyId} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-medium">コンピテンシー ID: {rating.competencyId}</h5>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...(Array(5) as unknown[])].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < (rating.rating ?? 0)
                                  ? 'fill-current text-yellow-500'
                                  : 'text-gray-300',
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{rating.rating}/5</span>
                      </div>
                    </div>

                    {rating.behaviors.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">
                          選択された行動指標: {rating.behaviors.length}項目
                        </span>
                      </div>
                    )}

                    {rating.comments !== null &&
                      rating.comments !== undefined &&
                      rating.comments !== '' && (
                        <p className="rounded bg-gray-50 p-2 text-sm text-gray-700">
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
          {((formData.careerGoals !== null &&
            formData.careerGoals !== undefined &&
            formData.careerGoals !== '') ||
            (formData.developmentPlan !== null &&
              formData.developmentPlan !== undefined &&
              formData.developmentPlan !== '')) && (
            <div className="space-y-3">
              <h4 className="flex items-center space-x-2 font-semibold">
                <Target className="h-4 w-4" />
                <span>目標・開発計画</span>
              </h4>

              {formData.careerGoals !== null &&
                formData.careerGoals !== undefined &&
                formData.careerGoals !== '' && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h5 className="mb-2 flex items-center space-x-2 font-medium">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span>キャリア目標</span>
                    </h5>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {formData.careerGoals}
                    </p>
                  </div>
                )}

              {formData.developmentPlan !== null &&
                formData.developmentPlan !== undefined &&
                formData.developmentPlan !== '' && (
                  <div className="rounded-lg bg-purple-50 p-4">
                    <h5 className="mb-2 flex items-center space-x-2 font-medium">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <span>開発計画</span>
                    </h5>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {formData.developmentPlan}
                    </p>
                  </div>
                )}
            </div>
          )}

          <Separator />

          {/* 強み・改善点 */}
          {((formData.strengths !== null &&
            formData.strengths !== undefined &&
            formData.strengths !== '') ||
            (formData.improvements !== null &&
              formData.improvements !== undefined &&
              formData.improvements !== '')) && (
            <div className="space-y-3">
              <h4 className="font-semibold">追加フィードバック</h4>

              {formData.strengths !== null &&
                formData.strengths !== undefined &&
                formData.strengths !== '' && (
                  <div className="rounded-lg bg-green-50 p-4">
                    <h5 className="mb-2 font-medium text-green-800">強み・優れた点</h5>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {formData.strengths}
                    </p>
                  </div>
                )}

              {formData.improvements !== null &&
                formData.improvements !== undefined &&
                formData.improvements !== '' && (
                  <div className="rounded-lg bg-orange-50 p-4">
                    <h5 className="mb-2 font-medium text-orange-800">改善点・成長領域</h5>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {formData.improvements}
                    </p>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 送信に関する注意事項 */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <h4 className="mb-2 font-semibold text-amber-900">📋 送信前の確認事項</h4>
          <ul className="space-y-1 text-sm text-amber-800">
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
          <AlertDescription>入力に不備があります。各項目を確認してください。</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
