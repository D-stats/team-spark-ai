import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { teamCache } from '@/lib/redis';
import { log, logBusinessEvent, logError } from '@/lib/logger';
import { withLogging } from '@/lib/api-logging';

export async function POST(request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // 管理者またはマネージャーのみチーム作成可能
    if (dbUser.role !== 'ADMIN' && dbUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'チーム作成権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, memberIds } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'チーム名は必須です' }, { status: 400 });
    }

    // 同名のチームが既に存在するかチェック
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: name.trim(),
        organizationId: dbUser.organizationId,
      },
    });

    if (existingTeam) {
      return NextResponse.json({ error: '同名のチームが既に存在します' }, { status: 400 });
    }

    // メンバーIDが有効かチェック
    if (memberIds && memberIds.length > 0) {
      const validMembers = await prisma.user.findMany({
        where: {
          id: { in: memberIds },
          organizationId: dbUser.organizationId,
          isActive: true,
        },
      });

      if (validMembers.length !== memberIds.length) {
        return NextResponse.json({ error: '無効なメンバーが含まれています' }, { status: 400 });
      }
    }

    // チームを作成
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: dbUser.organizationId,
        members:
          memberIds && memberIds.length > 0
            ? {
                create: memberIds.map((userId: string) => ({ userId })),
              }
            : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/teams');
    return NextResponse.json({ error: 'チームの作成に失敗しました' }, { status: 500 });
  }
}
