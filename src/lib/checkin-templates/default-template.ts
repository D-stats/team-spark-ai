import { prisma } from '@/lib/prisma';

export async function createDefaultCheckInTemplate(organizationId: string) {
  const defaultTemplate = {
    name: 'スタンダード週次チェックイン',
    description: '標準的な週次チェックインテンプレートです',
    frequency: 'WEEKLY' as const,
    questions: [
      {
        id: 'achievements',
        type: 'textarea',
        text: '今週達成したことは何ですか？',
        required: true,
      },
      {
        id: 'challenges',
        type: 'textarea',
        text: '今週直面した課題や困難があれば教えてください',
        required: false,
      },
      {
        id: 'next_goals',
        type: 'textarea',
        text: '来週の目標を教えてください',
        required: true,
      },
      {
        id: 'energy_level',
        type: 'rating',
        text: '今週のエネルギーレベルはどうでしたか？（1: 低い〜5: 高い）',
        required: false,
      },
      {
        id: 'support_needed',
        type: 'select',
        text: 'チームや上司からのサポートが必要な分野はありますか？',
        required: false,
        options: [
          '特になし',
          '技術的サポート',
          'プロジェクト管理',
          'コミュニケーション',
          'リソース',
          'その他',
        ],
      },
    ],
    isDefault: true,
    isActive: true,
    organizationId,
  };

  try {
    const template = await prisma.checkInTemplate.create({
      data: defaultTemplate,
    });

    return template;
  } catch (error) {
    console.error('Failed to create default template:', error);
    throw error;
  }
}

export async function ensureDefaultTemplate(organizationId: string) {
  // 既にデフォルトテンプレートが存在するかチェック
  const existingDefault = await prisma.checkInTemplate.findFirst({
    where: {
      organizationId,
      isDefault: true,
      isActive: true,
    },
  });

  if (existingDefault) {
    return existingDefault;
  }

  // デフォルトテンプレートが存在しない場合は作成
  return createDefaultCheckInTemplate(organizationId);
}
