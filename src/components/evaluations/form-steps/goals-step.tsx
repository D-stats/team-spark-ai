/**
 * 評価フォーム - 目標・開発計画ステップ
 * キャリア目標と開発計画を入力
 */

'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, BookOpen } from 'lucide-react';
import { useEvaluationStore } from '@/stores/evaluation.store';
import { EvaluationWithDetails } from '@/types/api';

interface EvaluationGoalsStepProps {
  evaluation: EvaluationWithDetails;
  isReadOnly?: boolean;
}

export function EvaluationGoalsStep({ evaluation, isReadOnly = false }: EvaluationGoalsStepProps) {
  const { formData, updateCareerGoals, updateDevelopmentPlan } = useEvaluationStore();

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Target className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <h4 className="mb-2 font-semibold text-green-900">目標と開発計画について</h4>
              <p className="text-sm text-green-800">
                今後のキャリア目標と具体的な開発計画を記入してください。
                この情報は個人の成長支援に活用されます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* キャリア目標 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>キャリア目標</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="careerGoals" className="text-base font-semibold">
              今後のキャリア目標・方向性
            </Label>
            <p className="text-sm text-gray-600">
              短期（1年以内）および中長期（2-3年）のキャリア目標を記述してください
            </p>
            <Textarea
              id="careerGoals"
              value={formData.careerGoals || ''}
              onChange={(e) => updateCareerGoals(e.target.value)}
              placeholder="例：
• 短期目標：フロントエンド開発のスキルを向上し、チームリーダーとしての経験を積む
• 中長期目標：技術的専門性を活かしてプロダクトマネージャーを目指す
• 目指したい役割や責任範囲、習得したいスキルなど"
              className="min-h-[120px]"
              readOnly={isReadOnly}
            />
          </div>

          {/* 入力ガイド */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <h5 className="mb-2 text-sm font-semibold text-blue-900">💡 記入のポイント</h5>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• 具体的で実現可能な目標を設定してください</li>
                <li>• 現在の役割からの成長ステップを明確にしてください</li>
                <li>• 技術的スキル、ソフトスキル両面を考慮してください</li>
                <li>• 組織や事業への貢献も含めて考えてください</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* 開発計画 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span>開発計画</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="developmentPlan" className="text-base font-semibold">
              具体的な成長・開発計画
            </Label>
            <p className="text-sm text-gray-600">
              目標達成のための具体的なアクションプランを記述してください
            </p>
            <Textarea
              id="developmentPlan"
              value={formData.developmentPlan || ''}
              onChange={(e) => updateDevelopmentPlan(e.target.value)}
              placeholder="例：
【技術スキル向上】
• React/TypeScriptの深い理解のため、月2冊技術書を読む
• オープンソースプロジェクトへの貢献を開始

【リーダーシップ開発】
• 新人メンバーのメンタリングを担当
• 社内勉強会の企画・運営に参加

【その他】
• 外部カンファレンスでの発表を目指す
• 業界動向を把握するため関連コミュニティに参加"
              className="min-h-[150px]"
              readOnly={isReadOnly}
            />
          </div>

          {/* 開発領域のヒント */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3">
                <h5 className="mb-2 text-sm font-semibold text-purple-900">🎯 開発領域の例</h5>
                <ul className="space-y-1 text-xs text-purple-800">
                  <li>• 技術的専門性の向上</li>
                  <li>• リーダーシップ・マネジメント</li>
                  <li>• コミュニケーション能力</li>
                  <li>• 問題解決・分析力</li>
                  <li>• 事業理解・戦略思考</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <h5 className="mb-2 text-sm font-semibold text-orange-900">📚 学習方法の例</h5>
                <ul className="space-y-1 text-xs text-orange-800">
                  <li>• 社内研修・外部セミナー参加</li>
                  <li>• メンタリング・コーチング</li>
                  <li>• 新しいプロジェクト・業務への挑戦</li>
                  <li>• 読書・オンライン学習</li>
                  <li>• 社外コミュニティ活動</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 支援要請 */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-base text-yellow-900">🤝 組織への支援要請</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-yellow-800">
            目標達成のために組織からの支援が必要な場合は、以下の観点で記述してください：
          </p>
          <ul className="mb-4 space-y-1 text-sm text-yellow-800">
            <li>• 必要な研修や学習機会の提供</li>
            <li>• 新しい業務やプロジェクトへのアサイン</li>
            <li>• メンタリングやコーチングの機会</li>
            <li>• リソースや環境の整備</li>
          </ul>
          <p className="text-xs text-yellow-700">
            ※ この内容は上司との面談で活用され、具体的な支援策の検討に役立てられます
          </p>
        </CardContent>
      </Card>

      {/* 評価タイプ別のガイド */}
      {evaluation.type === 'SELF' && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <h4 className="mb-2 font-semibold text-indigo-900">自己評価でのポイント</h4>
            <p className="text-sm text-indigo-800">
              自分自身の成長意欲や将来への展望を率直に表現してください。
              現実的でありながらも挑戦的な目標設定を心がけましょう。
            </p>
          </CardContent>
        </Card>
      )}

      {evaluation.type === 'MANAGER' && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <h4 className="mb-2 font-semibold text-emerald-900">上司評価でのポイント</h4>
            <p className="text-sm text-emerald-800">
              部下の現在の能力と将来のポテンシャルを考慮し、
              適切な挑戦レベルの目標と具体的な成長支援策を提案してください。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 文字数カウンター */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>キャリア目標: {formData.careerGoals?.length || 0}文字</span>
        <span>開発計画: {formData.developmentPlan?.length || 0}文字</span>
      </div>
    </div>
  );
}
