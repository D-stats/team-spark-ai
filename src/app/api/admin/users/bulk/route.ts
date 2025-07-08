import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  userIds: z.array(z.string())
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const validatedData = bulkActionSchema.parse(data);

    // Prevent admin from deactivating/deleting themselves
    if (validatedData.userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk action on yourself' },
        { status: 400 }
      );
    }

    let result;
    
    switch (validatedData.action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: {
            id: { in: validatedData.userIds },
            organizationId: session.user.organizationId
          },
          data: { isActive: true }
        });
        break;
        
      case 'deactivate':
        result = await prisma.user.updateMany({
          where: {
            id: { in: validatedData.userIds },
            organizationId: session.user.organizationId
          },
          data: { isActive: false }
        });
        break;
        
      case 'delete':
        // First delete related records
        await prisma.teamMember.deleteMany({
          where: { userId: { in: validatedData.userIds } }
        });
        
        await prisma.userSession.deleteMany({
          where: { userId: { in: validatedData.userIds } }
        });
        
        await prisma.loginHistory.deleteMany({
          where: { userId: { in: validatedData.userIds } }
        });
        
        // Then delete users
        result = await prisma.user.deleteMany({
          where: {
            id: { in: validatedData.userIds },
            organizationId: session.user.organizationId
          }
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${validatedData.action} completed for ${result.count} users`,
      affectedCount: result.count
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}