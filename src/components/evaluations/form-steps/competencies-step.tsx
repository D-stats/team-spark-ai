/**
 * 評価フォーム - コンピテンシーステップ
 * 各コンピテンシーの詳細評価を入力
 */

'use client';

import { useEffect, useState } from 'react';
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
  { value: 1, label: '未達成', color: 'text-red-600' },
  { value: 2, label: '要改善', color: 'text-orange-600' },
  { value: 3, label: '達成', color: 'text-yellow-600' },
  { value: 4, label: '優秀', color: 'text-blue-600' },
  { value: 5, label: '卓越', color: 'text-green-600' },
];

const categoryLabels = {
  CORE: 'コア・コンピテンシー',
  LEADERSHIP: 'リーダーシップ',
  TECHNICAL: 'テクニカル',
  BEHAVIORAL: '行動特性',
};

export function EvaluationCompetenciesStep({ 
  evaluation, 
  isReadOnly = false 
}: EvaluationCompetenciesStepProps) {
  const [competencies, setCompetencies] = useState<CompetencyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompetencies, setExpandedCompetencies] = useState<Set<string>>(new Set());

  const {
    formData,
    errors,
    updateCompetencyRating,
  } = useEvaluationStore();

  // コンピテンシー一覧の取得
  useEffect(() => {
    const fetchCompetencies = async () => {
      try {
        const response = await fetch('/api/competencies');
        const result = await response.json();
        
        if (result.success) {
          setCompetencies(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch competencies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetencies();
  }, []);

  // コンピテンシーの展開/折りたたみ
  const toggleCompetency = (competencyId: string) => {
    const newExpanded = new Set(expandedCompetencies);
    if (newExpanded.has(competencyId)) {
      newExpanded.delete(competencyId);
    } else {
      newExpanded.add(competencyId);
    }
    setExpandedCompetencies(newExpanded);
  };

  // 評価の更新
  const handleRatingChange = (competencyId: string, rating: number) => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { rating });
    }
  };

  const handleCommentsChange = (competencyId: string, comments: string) => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { comments });
    }
  };

  const handleBehaviorChange = (competencyId: string, behavior: string, checked: boolean) => {
    if (isReadOnly) return;

    const currentRating = formData.competencyRatings[competencyId];
    const currentBehaviors = currentRating?.behaviors || [];
    
    const updatedBehaviors = checked
      ? [...currentBehaviors, behavior]
      : currentBehaviors.filter(b => b !== behavior);

    updateCompetencyRating(competencyId, { behaviors: updatedBehaviors });
  };

  const handleExamplesChange = (competencyId: string, examples: string) => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { examples });
    }
  };

  const handleImprovementAreasChange = (competencyId: string, improvementAreas: string) => {
    if (!isReadOnly) {
      updateCompetencyRating(competencyId, { improvementAreas });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // カテゴリ別にグループ化
  const competenciesByCategory = competencies.reduce((acc, competency) => {
    const category = competency.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(competency);
    return acc;
  }, {} as Record<string, CompetencyWithStats[]>);

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">コンピテンシー評価について</h4>
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
            <h3 className="text-lg font-semibold">{categoryLabels[category as keyof typeof categoryLabels]}</h3>
            <Badge variant="outline">{categoryCompetencies.length}項目</Badge>
          </div>

          {categoryCompetencies.map((competency) => {
            const currentRating = formData.competencyRatings[competency.id];
            const isExpanded = expandedCompetencies.has(competency.id);
            const hasRating = !!currentRating?.rating;

            return (
              <Card key={competency.id} className={cn(
                'transition-all',
                hasRating ? 'border-green-200 bg-green-50' : 'border-gray-200'
              )}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleCompetency(competency.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <span>{competency.name}</span>
                        {hasRating && (
                          <Badge variant="outline" className="text-green-600">
                            評価済み
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {competency.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {hasRating && (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < (currentRating.rating || 0)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
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
                              'cursor-pointer transition-all p-3 text-center border-2',
                              currentRating?.rating === rating.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300',
                              isReadOnly && 'cursor-default opacity-75'
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

                      {errors[`competency_${competency.id}`] && (
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
                              checked={currentRating?.behaviors?.includes(behavior) || false}
                              onCheckedChange={(checked) => 
                                handleBehaviorChange(competency.id, behavior, !!checked)
                              }
                              disabled={isReadOnly}
                            />
                            <Label
                              htmlFor={`${competency.id}-behavior-${index}`}
                              className="text-sm leading-relaxed cursor-pointer"
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
                        value={currentRating?.comments || ''}
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
                        value={currentRating?.examples || ''}
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
                        value={currentRating?.improvementAreas || ''}
                        onChange={(e) => handleImprovementAreasChange(competency.id, e.target.value)}
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
          <div className="flex justify-between items-center">
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
          onClick={() => setExpandedCompetencies(new Set(competencies.map(c => c.id)))}
        >
          すべて展開
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedCompetencies(new Set())}
        >
          すべて折りたたみ
        </Button>
      </div>
    </div>
  );
}