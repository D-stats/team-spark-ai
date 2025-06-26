/**
 * 評価詳細・編集ページ
 */

import { EvaluationForm } from '@/components/evaluations/evaluation-form';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EvaluationDetailPage({ params }: PageProps) {
  return (
    <div className="container mx-auto py-6">
      <EvaluationForm evaluationId={params.id} />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: '評価入力 - TeamSpark AI',
    description: '従業員評価の入力・編集を行います',
  };
}
