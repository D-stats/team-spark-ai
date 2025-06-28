import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { ensureDefaultTemplate } from '@/lib/checkin-templates/default-template';
import { logError } from '@/lib/logger';

export async function POST(_request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const template = await ensureDefaultTemplate(dbUser.organizationId);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    logError(error as Error, 'POST /api/checkin-templates/ensure-default');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
