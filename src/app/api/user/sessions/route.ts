import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

export async function GET(): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const sessions = await prisma.userSession.findMany({
      where: {
        userId: dbUser.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    logError(error as Error, 'GET /api/user/sessions');
    return NextResponse.json({ error: 'セッション情報の取得に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (sessionId === null || sessionId === '') {
      return NextResponse.json({ error: 'セッションIDが必要です' }, { status: 400 });
    }

    // セッションが自分のものかチェック
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId: dbUser.id,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 });
    }

    // セッションを無効化
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'セッションが正常に終了されました' });
  } catch (error) {
    logError(error as Error, 'DELETE /api/user/sessions');
    return NextResponse.json({ error: 'セッションの終了に失敗しました' }, { status: 500 });
  }
}
