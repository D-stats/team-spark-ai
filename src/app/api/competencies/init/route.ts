import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { createDefaultCompetencies } from '@/services/evaluation.service';
import { prisma } from '@/lib/prisma';

// デフォルトコンピテンシーの初期化
export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者のみ実行可能
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'デフォルトコンピテンシーの初期化権限がありません' },
        { status: 403 }
      );
    }

    // 既存のコンピテンシーがあるか確認
    const existingCompetencies = await prisma.competency.findMany({
      where: {
        organizationId: dbUser.organizationId,
        isActive: true,
      },
    });

    if (existingCompetencies.length > 0) {
      return NextResponse.json(
        { error: '既にコンピテンシーが存在します。デフォルトの初期化はスキップされました。' },
        { status: 400 }
      );
    }

    const competencies = await createDefaultCompetencies(dbUser.organizationId);

    // 作成されたコンピテンシーを取得
    const createdCompetencies = await prisma.competency.findMany({
      where: {
        organizationId: dbUser.organizationId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `${createdCompetencies.length}件のデフォルトコンピテンシーを初期化しました`,
      competencies: createdCompetencies,
    }, { status: 201 });
  } catch (error) {
    console.error('Error initializing default competencies:', error);
    return NextResponse.json(
      { error: 'デフォルトコンピテンシーの初期化に失敗しました' },
      { status: 500 }
    );
  }
}