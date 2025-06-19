/**
 * 評価フォーム - 概要ステップ
 * 総合評価とコメントを入力
 */

'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useEvaluationStore } from '@/stores/evaluation.store';
import { EvaluationWithDetails } from '@/types/api';
import { cn } from '@/lib/utils';

interface EvaluationOverviewStepProps {
  evaluation: EvaluationWithDetails;
  isReadOnly?: boolean;
}

const ratingOptions = [
  { value: 1, label: '要改善', description: '期待を大きく下回る', color: 'text-red-600' },
  { value: 2, label: '改善の余地あり', description: '期待を下回る', color: 'text-orange-600' },
  { value: 3, label: '期待通り', description: '期待を満たす', color: 'text-yellow-600' },
  { value: 4, label: '期待以上', description: '期待を上回る', color: 'text-blue-600' },
  { value: 5, label: '卓越', description: '期待を大きく上回る', color: 'text-green-600' },
];

export function EvaluationOverviewStep({ evaluation, isReadOnly = false }: EvaluationOverviewStepProps) {
  const {
    formData,
    errors,
    updateOverallRating,
    updateOverallComments,
    updateStrengths,
    updateImprovements,
  } = useEvaluationStore();

  const handleRatingChange = (rating: number) => {
    if (!isReadOnly) {
      updateOverallRating(rating);
    }
  };

  return (
    <div className="space-y-6">
      {/* 評価対象者情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">評価対象者</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
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

      {/* 総合評価 */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">
            総合評価 <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            全体的なパフォーマンスを5段階で評価してください
          </p>
        </div>

        <div className="grid gap-3">
          {ratingOptions.map((option) => (
            <Card
              key={option.value}
              className={cn(
                'cursor-pointer transition-all border-2',
                formData.overallRating === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300',
                isReadOnly && 'cursor-default opacity-75'
              )}
              onClick={() => handleRatingChange(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-5 w-5',
                            i < option.value
                              ? `${option.color} fill-current`
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <div>
                      <div className={cn('font-semibold', option.color)}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-400">
                    {option.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {errors.overallRating && (
          <p className="text-sm text-red-600">{errors.overallRating}</p>
        )}
      </div>

      {/* 総合コメント */}
      <div className="space-y-2">
        <Label htmlFor="overallComments" className="text-base font-semibold">
          総合コメント <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-600">
          評価の理由や根拠を具体的に記述してください（最低100文字）
        </p>
        <Textarea
          id="overallComments"
          value={formData.overallComments || ''}
          onChange={(e) => updateOverallComments(e.target.value)}
          placeholder="評価の理由や根拠を具体的に記述してください..."
          className="min-h-[120px]"
          readOnly={isReadOnly}
        />
        <div className="flex justify-between items-center text-sm">
          <div>
            {errors.overallComments && (
              <span className="text-red-600">{errors.overallComments}</span>
            )}
          </div>
          <span className={cn(
            'text-gray-500',
            (formData.overallComments?.length || 0) < 100 && 'text-orange-600'
          )}>
            {formData.overallComments?.length || 0}/100文字以上
          </span>
        </div>
      </div>

      {/* 強み */}
      <div className="space-y-2">
        <Label htmlFor="strengths" className="text-base font-semibold">
          強み・優れた点
        </Label>
        <p className="text-sm text-gray-600">
          特に優れていた点や強みを記述してください
        </p>
        <Textarea
          id="strengths"
          value={formData.strengths || ''}
          onChange={(e) => updateStrengths(e.target.value)}
          placeholder="特に優れていた点や強みを記述してください..."
          className="min-h-[100px]"
          readOnly={isReadOnly}
        />
      </div>

      {/* 改善点 */}
      <div className="space-y-2">
        <Label htmlFor="improvements" className="text-base font-semibold">
          改善点・成長領域
        </Label>
        <p className="text-sm text-gray-600">
          今後改善や成長が期待される領域を記述してください
        </p>
        <Textarea
          id="improvements"
          value={formData.improvements || ''}
          onChange={(e) => updateImprovements(e.target.value)}
          placeholder="今後改善や成長が期待される領域を記述してください..."
          className="min-h-[100px]"
          readOnly={isReadOnly}
        />
      </div>

      {/* 入力ガイド */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📝 入力のポイント</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 具体的な事例や行動を含めて記述してください</li>
            <li>• 客観的で建設的なフィードバックを心がけてください</li>
            <li>• 感情的な表現ではなく、事実に基づいた評価をしてください</li>
            <li>• 改善点は今後の成長につながる形で表現してください</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}