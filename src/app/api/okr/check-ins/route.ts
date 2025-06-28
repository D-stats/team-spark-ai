import { NextRequest, NextResponse } from 'next/server';
import { getUserWithOrganization } from '@/lib/auth/utils';
import { OkrService } from '@/services/okr.service';
import { z } from 'zod';
import { logError } from '@/lib/logger';

const createCheckInSchema = z.object({
  keyResultId: z.string(),
  currentValue: z.number().optional(),
  progress: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).optional(),
  comment: z.string().optional(),
  blockers: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCheckInSchema.parse(body);

    const updatedKeyResult = await OkrService.createCheckIn(result.dbUser.id, validatedData);

    return NextResponse.json(updatedKeyResult, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'POST /api/okr/check-ins');
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getUserWithOrganization();
    if (!result?.dbUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyResultId = searchParams.get('keyResultId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!keyResultId) {
      return NextResponse.json({ error: 'keyResultId is required' }, { status: 400 });
    }

    const checkIns = await OkrService.getCheckInHistory(keyResultId, limit);

    return NextResponse.json(checkIns);
  } catch (error) {
    logError(error as Error, 'GET /api/okr/check-ins');
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}
