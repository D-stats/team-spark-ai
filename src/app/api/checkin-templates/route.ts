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

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.checkInTemplate.findMany({
      where: {
        organizationId: (user as UserWithOrgAndRole).organizationId,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    logError(error as Error, 'GET /api/checkin-templates');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    };
    const { name, description, frequency, questions, isDefault } = body;

    // Validation
    if (name === undefined || frequency === undefined || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // When setting default template, set others to false
    if (isDefault === true) {
      await prisma.checkInTemplate.updateMany({
        where: {
          organizationId: (user as UserWithOrgAndRole).organizationId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.checkInTemplate.create({
      data: {
        name,
        description,
        frequency: frequency as CheckInFrequency,
        questions: (questions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        isDefault: isDefault ?? false,
        organizationId: (user as UserWithOrgAndRole).organizationId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/checkin-templates');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
