import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { ensureDefaultTemplate } from '@/lib/checkin-templates/default-template';

export async function POST(_request: NextRequest) {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const template = await ensureDefaultTemplate(dbUser.organizationId);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to ensure default template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
