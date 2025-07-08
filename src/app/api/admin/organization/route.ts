import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
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
      name: formData.get('name') as string,
      slug: formData.get('slug') as string
    };

    const validatedData = updateOrganizationSchema.parse(data);

    // Check if slug is already taken by another organization
    const existingOrg = await prisma.organization.findFirst({
      where: {
        slug: validatedData.slug,
        id: { not: session.user.organizationId }
      }
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 400 }
      );
    }

    // Update the organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        name: validatedData.name,
        slug: validatedData.slug
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