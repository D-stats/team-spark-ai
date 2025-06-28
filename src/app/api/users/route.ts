import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, withErrorHandler } from '@/lib/api-helpers';
import { createPaginatedResponse } from '@/lib/openapi/validator';
import { prisma } from '@/lib/prisma';

// Export with middleware applied for Next.js App Router
export const GET = withRateLimit(
  withErrorHandler(async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const skip = (page - 1) * limit;

    // Get users from database
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    const response = createPaginatedResponse(users, page, limit, total);

    return NextResponse.json(response);
  }),
);
