import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    
    const body = await request.json();
    const { achievements, challenges, nextWeekGoals, moodRating } = body;

    if (!achievements || !nextWeekGoals || typeof moodRating !== 'number') {
      return NextResponse.json(
        { error: '必要な項目が入力されていません' },
        { status: 400 }
      );
    }

    if (moodRating < 1 || moodRating > 5) {
      return NextResponse.json(
        { error: '気分評価は1-5の範囲で入力してください' },
        { status: 400 }
      );
    }

    // 今週のチェックインが既に存在するかチェック
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId: dbUser.id,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: '今週のチェックインは既に完了しています' },
        { status: 400 }
      );
    }

    // チェックインを作成
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: dbUser.id,
        achievements,
        challenges: challenges || null,
        nextWeekGoals,
        moodRating,
      },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'チェックインの作成に失敗しました' },
      { status: 500 }
    );
  }
}