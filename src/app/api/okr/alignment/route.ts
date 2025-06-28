import { NextRequest, NextResponse } from 'next/server';
import { getUserWithOrganization } from '@/lib/auth/utils';
import { OkrService } from '@/services/okr.service';
import { OkrCycle } from '@prisma/client';
import { z } from 'zod';
import { logError } from '@/lib/logger';

const getAlignmentSchema = z.object({
  cycle: z.nativeEnum(OkrCycle),
  year: z.string().transform(Number),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const result = await getUserWithOrganization();
    if (result?.dbUser?.organizationId === undefined || result.dbUser.organizationId === '') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const { cycle, year } = getAlignmentSchema.parse(params);

    const alignment = await OkrService.getOkrAlignment(result.dbUser.organizationId, cycle, year);

    return NextResponse.json(alignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'GET /api/okr/alignment');
    return NextResponse.json({ error: 'Failed to fetch OKR alignment' }, { status: 500 });
  }
}
