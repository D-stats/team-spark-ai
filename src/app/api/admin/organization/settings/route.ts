import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();

    // Update organization settings
    const updatedOrganization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        settings: settings
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedOrganization.settings
    });

  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}