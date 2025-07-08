import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().optional()
});

export async function PUT(
  request: NextRequest,
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

    const formData = await request.formData();
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      managerId: formData.get('managerId') as string || undefined
    };

    const validatedData = updateTeamSchema.parse(data);

    // Check if team exists and belongs to the organization
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        managerId: validatedData.managerId || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
      team: updatedTeam
    });

  } catch (error) {
    console.error('Error updating team:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

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

    // Check if team exists and belongs to the organization
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Delete team members first
    await prisma.teamMember.deleteMany({
      where: { teamId: params.id }
    });

    // Delete the team
    await prisma.team.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}