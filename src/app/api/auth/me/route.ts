/**
 * 現在のユーザー情報取得API
 */

import { NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';

export async function GET(): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const userData = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      avatar: dbUser.avatarUrl,
    };

    return NextResponse.json(createSuccessResponse(userData));
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
