/**
 * 評価結果表示ページ
 */

import { EvaluationResultsClient } from '@/components/evaluations/evaluation-results-client';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EvaluationResultsPage({ params }: PageProps): JSX.Element {
  return <EvaluationResultsClient evaluationId={params.id} />;
}

export async function generateMetadata(): Promise<{ title: string; description: string }> {
  return {
    title: '評価結果 - TeamSpark AI',
    description: '従業員評価の結果を確認できます',
  };
}
