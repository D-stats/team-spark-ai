import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
  teams: z.string().optional()
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
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      teams: formData.get('teams') as string
    };

    const validatedData = inviteUserSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Generate a temporary password (user will need to change on first login)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role as any,
        password: hashedPassword,
        organizationId: session.user.organizationId,
        isActive: true
      }
    });

    // Add to team if specified
    if (validatedData.teams) {
      await prisma.teamMember.create({
        data: {
          userId: newUser.id,
          teamId: validatedData.teams
        }
      });
    }

    // TODO: Send invitation email with temporary password
    // For now, we'll just log it (in production, use proper email service)
    console.log(`User invited: ${validatedData.email}, temp password: ${tempPassword}`);

    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      tempPassword // In production, don't return this - send via email
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}