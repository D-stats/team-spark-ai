import { NextRequest, NextResponse } from 'next/server';
import { getUserWithOrganization } from '@/lib/auth/utils';
import { OkrService } from '@/services/okr.service';
import { z } from 'zod';
import { MilestoneStatus } from '@prisma/client';
import { logError } from '@/lib/logger';

const updateKeyResultSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  currentValue: z.number().optional(),
  milestoneStatus: z.nativeEnum(MilestoneStatus).optional(),
  progress: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateKeyResultSchema.parse(body);

    const updatedKeyResult = await OkrService.updateKeyResult(params.id, validatedData);

    return NextResponse.json(updatedKeyResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'PATCH /api/okr/key-results/[id]', { keyResultId: params.id });
    return NextResponse.json({ error: 'Failed to update key result' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await OkrService.deleteKeyResult(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'DELETE /api/okr/key-results/[id]', { keyResultId: params.id });
    return NextResponse.json({ error: 'Failed to delete key result' }, { status: 500 });
  }
}
