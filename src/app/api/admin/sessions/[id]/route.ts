import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the session belongs to a user in the same organization
    const sessionToRevoke = await prisma.userSession.findFirst({
      where: {
        id: params.id,
        user: {
          organizationId: session.user.organizationId
        }
      }
    });

    if (!sessionToRevoke) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Revoke the session
    await prisma.userSession.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}