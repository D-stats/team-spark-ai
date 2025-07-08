import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(1)
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const data = {
      name: formData.get('name') as string
    };

    const validatedData = updateOrganizationSchema.parse(data);


    // Update the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name: validatedData.name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      organization: updatedOrganization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}