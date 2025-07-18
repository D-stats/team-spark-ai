import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth/utils';
import { logError } from '@/lib/logger';
import { CheckInFrequency, Prisma } from '@prisma/client';

interface UserWithOrgAndRole {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

interface Props {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Props): Promise<NextResponse> {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.checkInTemplate.findFirst({
      where: {
        id: params.id,
        organizationId: (user as UserWithOrgAndRole).organizationId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    logError(error as Error, 'GET /api/checkin-templates/[id]', { templateId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Props): Promise<NextResponse> {
  try {
    const user = await getUser();
    if (!user || (user as UserWithOrgAndRole).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      frequency?: string;
      questions?: unknown;
      isDefault?: boolean;
      isActive?: boolean;
    };
    const { name, description, frequency, questions, isDefault, isActive } = body;

    // 既存テンプレートの確認
    const existingTemplate = await prisma.checkInTemplate.findFirst({
      where: {
        id: params.id,
        organizationId: (user as UserWithOrgAndRole).organizationId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // デフォルトテンプレートの設定時は他をfalseに
    if (isDefault === true && existingTemplate.isDefault === false) {
      await prisma.checkInTemplate.updateMany({
        where: {
          organizationId: (user as UserWithOrgAndRole).organizationId,
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.checkInTemplate.update({
      where: { id: params.id },
      data: {
        name: name ?? existingTemplate.name,
        description: description ?? existingTemplate.description,
        frequency: (frequency as CheckInFrequency) ?? existingTemplate.frequency,
        questions: questions ?? existingTemplate.questions ?? Prisma.JsonNull,
        isDefault: isDefault ?? existingTemplate.isDefault,
        isActive: isActive ?? existingTemplate.isActive,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    logError(error as Error, 'PUT /api/checkin-templates/[id]', { templateId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Props): Promise<NextResponse> {
  try {
    const user = await getUser();
    if (!user || (user as UserWithOrgAndRole).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 既存テンプレートの確認
    const existingTemplate = await prisma.checkInTemplate.findFirst({
      where: {
        id: params.id,
        organizationId: (user as UserWithOrgAndRole).organizationId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // デフォルトテンプレートの削除は禁止
    if (existingTemplate.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default template' }, { status: 400 });
    }

    // チェックインで使用されているテンプレートは削除できない
    const usedInCheckIns = await prisma.checkIn.findFirst({
      where: { templateId: params.id },
    });

    if (usedInCheckIns) {
      return NextResponse.json(
        { error: 'Cannot delete template that is used in check-ins' },
        { status: 400 },
      );
    }

    await prisma.checkInTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'DELETE /api/checkin-templates/[id]', { templateId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
