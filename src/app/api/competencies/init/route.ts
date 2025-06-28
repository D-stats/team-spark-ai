import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { createDefaultCompetencies } from '@/services/evaluation.service';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

// Initialize default competencies
export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    // Only admins can execute
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to initialize default competencies' },
        { status: 403 },
      );
    }

    // Check if existing competencies exist
    const existingCompetencies = await prisma.competency.findMany({
      where: {
        organizationId: dbUser.organizationId,
        isActive: true,
      },
    });

    if (existingCompetencies.length > 0) {
      return NextResponse.json(
        { error: 'Competencies already exist. Default initialization was skipped.' },
        { status: 400 },
      );
    }

    await createDefaultCompetencies(dbUser.organizationId);

    // Get created competencies
    const createdCompetencies = await prisma.competency.findMany({
      where: {
        organizationId: dbUser.organizationId,
        isActive: true,
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(
      {
        success: true,
        message: `Initialized ${createdCompetencies.length} default competencies`,
        competencies: createdCompetencies,
      },
      { status: 201 },
    );
  } catch (error) {
    logError(error as Error, 'POST /api/competencies/init');
    return NextResponse.json(
      { error: 'Failed to initialize default competencies' },
      { status: 500 },
    );
  }
}
