import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth/utils';

interface UserWithOrgAndRole {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

export async function GET(_request: NextRequest) {
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
    console.error('Failed to fetch check-in templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || (user as UserWithOrgAndRole).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, frequency, questions, isDefault } = body;

    // Validation
    if (!name || !frequency || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // When setting default template, set others to false
    if (isDefault) {
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
        frequency,
        questions,
        isDefault: isDefault || false,
        organizationId: (user as UserWithOrgAndRole).organizationId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to create check-in template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
