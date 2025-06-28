/**
 * Evaluation form - Competencies step
 * Input detailed evaluation for each competency
 */

'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Star, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useEvaluationStore } from '@/stores/evaluation.store';
import { EvaluationWithDetails, CompetencyWithStats } from '@/types/api';
import { cn } from '@/lib/utils';

interface EvaluationCompetenciesStepProps {
  evaluation: EvaluationWithDetails;
  isReadOnly?: boolean;
}

const ratingLabels = [
  { value: 1, label: 'Not Met', color: 'text-red-600' },
  { value: 2, label: 'Needs Improvement', color: 'text-orange-600' },
  { value: 3, label: 'Met', color: 'text-yellow-600' },
  { value: 4, label: 'Exceeds', color: 'text-blue-600' },
  { value: 5, label: 'Outstanding', color: 'text-green-600' },
];

const categoryLabels = {
  CORE: 'Core Competencies',
  LEADERSHIP: 'Leadership',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
};

export const EvaluationCompetenciesStep = memo(function EvaluationCompetenciesStep({
  evaluation: _evaluation,
  isReadOnly = false,
}: EvaluationCompetenciesStepProps): JSX.Element {
  const [competencies, setCompetencies] = useState<CompetencyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompetencies, setExpandedCompetencies] = useState<Set<string>>(new Set());

  const { formData, errors, updateCompetencyRating } = useEvaluationStore();

  // Get competencies list
  useEffect(() => {
    const fetchCompetencies = async (): Promise<void> => {
      try {
        const response = await fetch('/api/competencies');
        const result = (await response.json()) as { success: boolean; data: CompetencyWithStats[] };

        if (result.success === true) {
          setCompetencies(result.data);
        }
      } catch (error) {
        // Error fetching competencies
      } finally {
        setLoading(false);
      }
    };

    void fetchCompetencies();
  }, []);

  // コンピテンシーの展開/折りたたみ
  const toggleCompetency = (competencyId: string): void => {
    const newExpanded = new Set(expandedCompetencies);
    if (newExpanded.has(competencyId)) {
      newExpanded.delete(competencyId);
    } else {
      newExpanded.add(competencyId);
    }
    setExpandedCompetencies(newExpanded);
  };

  // 評価の更新
  const handleRatingChange = (competencyId: string, rating: number): void => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { rating });
    }
  };

  const handleCommentsChange = (competencyId: string, comments: string): void => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { comments });
    }
  };

  const handleBehaviorChange = (competencyId: string, behavior: string, checked: boolean): void => {
    if (isReadOnly) return;

    const currentRating = formData.competencyRatings[competencyId];
    const currentBehaviors = currentRating?.behaviors ?? [];

    const updatedBehaviors = checked
      ? [...currentBehaviors, behavior]
      : currentBehaviors.filter((b) => b !== behavior);

    updateCompetencyRating(competencyId, { behaviors: updatedBehaviors });
  };

  const handleExamplesChange = (competencyId: string, examples: string): void => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { examples });
    }
  };

  const handleImprovementAreasChange = (competencyId: string, improvementAreas: string): void => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { improvementAreas });
    }
  };

  // カテゴリ別にグループ化 - useMemoで最適化
  const competenciesByCategory = useMemo(
    () =>
      competencies.reduce(
        (acc, competency) => {
          const category = competency.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(competency);
          return acc;
        },
        {} as Record<string, CompetencyWithStats[]>,
      ),
    [competencies],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h4 className="mb-2 font-semibold text-blue-900">コンピテンシー評価について</h4>
              <p className="text-sm text-blue-800">
                各コンピテンシーについて、1〜5段階で評価してください。
                該当する行動指標にチェックを入れ、具体的な事例やコメントを記入してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* コンピテンシー評価 */}
      {Object.entries(competenciesByCategory).map(([category, categoryCompetencies]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h3>
            <Badge variant="outline">{categoryCompetencies.length}項目</Badge>
          </div>

          {categoryCompetencies.map((competency) => {
            const currentRating = formData.competencyRatings[competency.id];
            const isExpanded = expandedCompetencies.has(competency.id);
            const hasRating = currentRating?.rating !== undefined;

            return (
              <Card
                key={competency.id}
                className={cn(
                  'transition-all',
                  hasRating ? 'border-green-200 bg-green-50' : 'border-gray-200',
                )}
              >
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleCompetency(competency.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <span>{competency.name}</span>
                        {hasRating && (
                          <Badge variant="outline" className="text-green-600">
                            評価済み
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="mt-1 text-sm text-gray-600">{competency.description}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {hasRating && (
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < (currentRating.rating ?? 0)
                                  ? 'fill-current text-yellow-500'
                                  : 'text-gray-300',
                              )}
                            />
                          ))}
                        </div>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 border-t">
                    {/* 評価スコア */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        評価 <span className="text-red-500">*</span>
                      </Label>

                      <div className="grid grid-cols-5 gap-2">
                        {ratingLabels.map((rating) => (
                          <Card
                            key={rating.value}
                            className={cn(
                              'cursor-pointer border-2 p-3 text-center transition-all',
                              currentRating?.rating === rating.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300',
                              isReadOnly && 'cursor-default opacity-75',
                            )}
                            onClick={() => handleRatingChange(competency.id, rating.value)}
                          >
                            <div className="text-lg font-bold">{rating.value}</div>
                            <div className={cn('text-xs font-medium', rating.color)}>
                              {rating.label}
                            </div>
                          </Card>
                        ))}
                      </div>

                      {errors[`competency_${competency.id}`] !== undefined &&
                        errors[`competency_${competency.id}`] !== '' && (
                          <p className="text-sm text-red-600">
                            {errors[`competency_${competency.id}`]}
                          </p>
                        )}
                    </div>

                    {/* 行動指標 */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        該当する行動指標 <span className="text-red-500">*</span>
                      </Label>

                      <div className="space-y-2">
                        {competency.behaviors.map((behavior, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <Checkbox
                              id={`${competency.id}-behavior-${index}`}
                              checked={currentRating?.behaviors?.includes(behavior) ?? false}
                              onCheckedChange={(checked: boolean | 'indeterminate') =>
                                handleBehaviorChange(competency.id, behavior, checked === true)
                              }
                              disabled={isReadOnly}
                            />
                            <Label
                              htmlFor={`${competency.id}-behavior-${index}`}
                              className="cursor-pointer text-sm leading-relaxed"
                            >
                              {behavior}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* コメント */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        評価コメント <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={currentRating?.comments ?? ''}
                        onChange={(e) => handleCommentsChange(competency.id, e.target.value)}
                        placeholder="評価の根拠や具体的な事例を記述してください..."
                        className="min-h-[80px]"
                        readOnly={isReadOnly}
                      />
                    </div>

                    {/* 具体例 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">具体的な事例</Label>
                      <Textarea
                        value={currentRating?.examples ?? ''}
                        onChange={(e) => handleExamplesChange(competency.id, e.target.value)}
                        placeholder="具体的な行動や成果の事例を記述してください..."
                        className="min-h-[60px]"
                        readOnly={isReadOnly}
                      />
                    </div>

                    {/* 改善領域 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">改善・成長領域</Label>
                      <Textarea
                        value={currentRating?.improvementAreas ?? ''}
                        onChange={(e) =>
                          handleImprovementAreasChange(competency.id, e.target.value)
                        }
                        placeholder="このコンピテンシーで改善や成長が期待される領域..."
                        className="min-h-[60px]"
                        readOnly={isReadOnly}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ))}

      {/* 進捗表示 */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">評価進捗</span>
            <span className="text-sm text-gray-600">
              {Object.keys(formData.competencyRatings).length} / {competencies.length} 完了
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 一括展開/折りたたみボタン */}
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedCompetencies(new Set(competencies.map((c) => c.id)))}
        >
          すべて展開
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExpandedCompetencies(new Set())}>
          すべて折りたたみ
        </Button>
      </div>
    </div>
  );
});
