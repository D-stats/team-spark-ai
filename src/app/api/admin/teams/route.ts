import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().optional(),
  memberIds: z.string().optional()
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

    const formData = await request.formData();
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      managerId: formData.get('managerId') as string || undefined,
      memberIds: formData.get('memberIds') as string || undefined
    };

    const validatedData = createTeamSchema.parse(data);

    // Create the team
    const newTeam = await prisma.team.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        managerId: validatedData.managerId,
        organizationId: session.user.organizationId
      }
    });

    // Add members if specified
    if (validatedData.memberIds) {
      const memberIdArray = validatedData.memberIds.split(',').filter(id => id.trim());
      
      if (memberIdArray.length > 0) {
        await prisma.teamMember.createMany({
          data: memberIdArray.map(memberId => ({
            teamId: newTeam.id,
            userId: memberId.trim()
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: newTeam
    });

  } catch (error) {
    console.error('Error creating team:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}