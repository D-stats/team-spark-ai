import { NextRequest, NextResponse } from 'next/server';
import { getUserWithOrganization } from '@/lib/auth/utils';
import { OkrService } from '@/services/okr.service';
import { KeyResultType, MilestoneStatus } from '@prisma/client';
import { z } from 'zod';
import { logError } from '@/lib/logger';

const createKeyResultSchema = z
  .object({
    objectiveId: z.string(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    type: z.nativeEnum(KeyResultType),
    ownerId: z.string().optional(),
    // For METRIC type
    startValue: z.number().optional(),
    targetValue: z.number().optional(),
    unit: z.string().optional(),
    // For MILESTONE type
    milestoneStatus: z.nativeEnum(MilestoneStatus).optional(),
  })
  .refine(
    (data) => {
      if (data.type === KeyResultType.METRIC) {
        return data.targetValue !== undefined;
      }
      return true;
    },
    {
      message: 'Target value is required for metric key results',
      path: ['targetValue'],
    },
  );

export async function POST(request: NextRequest) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKeyResultSchema.parse(body);

    // Check if user has access to the objective
    const objective = await OkrService.getObjectiveById(validatedData.objectiveId);
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    if (objective.organizationId !== result.dbUser.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const keyResult = await OkrService.createKeyResult(validatedData);

    return NextResponse.json(keyResult, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'POST /api/okr/key-results');
    return NextResponse.json({ error: 'Failed to create key result' }, { status: 500 });
  }
}
