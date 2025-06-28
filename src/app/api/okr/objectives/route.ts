import { NextRequest, NextResponse } from 'next/server';
import { getUserWithOrganization } from '@/lib/auth/utils';
import { OkrService } from '@/services/okr.service';
import { ObjectiveOwner, OkrCycle, ObjectiveStatus } from '@prisma/client';
import { z } from 'zod';
import { logError } from '@/lib/logger';

// Validation schemas
const createObjectiveSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  ownerType: z.nativeEnum(ObjectiveOwner),
  ownerUserId: z.string().optional(),
  ownerTeamId: z.string().optional(),
  parentId: z.string().optional(),
  cycle: z.nativeEnum(OkrCycle),
  year: z.number().int().min(2024).max(2100),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

const getObjectivesSchema = z.object({
  cycle: z.nativeEnum(OkrCycle).optional(),
  year: z.string().transform(Number).optional(),
  ownerType: z.nativeEnum(ObjectiveOwner).optional(),
  ownerUserId: z.string().optional(),
  ownerTeamId: z.string().optional(),
  status: z.nativeEnum(ObjectiveStatus).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const filters = getObjectivesSchema.parse(params);

    const objectives = await OkrService.getOrganizationObjectives(
      result.dbUser.organizationId,
      filters,
    );

    return NextResponse.json(objectives);
  } catch (error) {
    logError(error as Error, 'GET /api/okr/objectives');
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createObjectiveSchema.parse(body);

    // Check permissions
    if (validatedData.ownerType === ObjectiveOwner.COMPANY && result.dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create company objectives' },
        { status: 403 },
      );
    }

    if (validatedData.ownerType === ObjectiveOwner.TEAM && result.dbUser.role === 'MEMBER') {
      // TODO: Check if user is team manager
      return NextResponse.json(
        { error: 'Only managers can create team objectives' },
        { status: 403 },
      );
    }

    // Set the appropriate owner ID based on type
    if (validatedData.ownerType === ObjectiveOwner.INDIVIDUAL) {
      validatedData.ownerUserId = result.dbUser.id;
    }

    const objective = await OkrService.createObjective(result.dbUser.organizationId, validatedData);

    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'POST /api/okr/objectives');
    return NextResponse.json({ error: 'Failed to create objective' }, { status: 500 });
  }
}
