/**
 * Individual Team Management API
 * TSA-46: Individual team CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { canAccessTeamManagement, isAdmin } from '@/lib/auth/rbac';
import { requireAuthWithOrganizationAPI } from '@/lib/auth/utils';
import { logError } from '@/lib/logger';
import { logUserAction } from '@/lib/audit-log';

// Validation schemas
const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  managerId: z.string().optional(),
  parentTeamId: z.string().optional(),
  teamType: z.enum(['REGULAR', 'DEPARTMENT', 'PROJECT', 'CROSS_FUNCTIONAL']).optional(),
  isActive: z.boolean().optional(),
  maxMembers: z.number().int().positive().optional(),
  settings: z.object({}).optional(),
  action: z.enum(['activate', 'deactivate', 'delete']).optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/teams/[id]
 * Get individual team details
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const result = await requireAuthWithOrganizationAPI();
    if (!result) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required.' },
        { status: 401 },
      );
    }
    const { dbUser } = result;

    if (!canAccessTeamManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to view teams.' },
        { status: 403 },
      );
    }

    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        parentTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        childTeams: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { members: true },
            },
          },
        },
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
            joinedAt: true,
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            members: true,
            objectives: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', message: 'The requested team does not exist.' },
        { status: 404 },
      );
    }

    // Managers can only see teams they manage (unless they're admin)
    if (dbUser.role === 'MANAGER' && !isAdmin(dbUser) && team.managerId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You can only view teams you manage.' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      team: {
        ...team,
        memberCount: team._count.members,
        objectiveCount: team._count.objectives,
        members: team.members.map((m) => ({ ...m.user, joinedAt: m.joinedAt })),
        isAtCapacity: team.maxMembers ? team._count.members >= team.maxMembers : false,
      },
    });
  } catch (error) {
    logError(error as Error, `GET /api/admin/teams/${params.id}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/teams/[id]
 * Update team details or perform actions
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const result = await requireAuthWithOrganizationAPI();
    if (!result) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required.' },
        { status: 401 },
      );
    }
    const { dbUser } = result;

    if (!canAccessTeamManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to update teams.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

    // Find the team
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', message: 'The requested team does not exist.' },
        { status: 404 },
      );
    }

    // Check if manager can only update their own teams
    if (dbUser.role === 'MANAGER' && !isAdmin(dbUser) && team.managerId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You can only update teams you manage.' },
        { status: 403 },
      );
    }

    // Handle special actions
    if (validatedData.action) {
      switch (validatedData.action) {
        case 'activate':
          await prisma.team.update({
            where: { id: params.id },
            data: { isActive: true },
          });
          break;
        case 'deactivate':
          await prisma.team.update({
            where: { id: params.id },
            data: { isActive: false },
          });
          break;
        case 'delete':
          // This should be handled by DELETE method, but we'll support it here too
          await prisma.team.delete({
            where: { id: params.id },
          });
          break;
      }

      // Create audit log
      await logUserAction(
        dbUser.organizationId,
        dbUser.id,
        'UPDATE',
        'Team',
        params.id,
        {
          old: { isActive: team.isActive },
          new: { isActive: validatedData.action === 'activate' },
          action: validatedData.action,
        } as any,
        request,
      );

      return NextResponse.json({
        message: `Team ${validatedData.action}d successfully`,
      });
    }

    // Validate manager exists and is in same organization
    if (validatedData.managerId) {
      const manager = await prisma.user.findFirst({
        where: {
          id: validatedData.managerId,
          organizationId: dbUser.organizationId,
          isActive: true,
        },
      });

      if (!manager) {
        return NextResponse.json(
          { error: 'Invalid manager', message: 'Manager not found or inactive.' },
          { status: 400 },
        );
      }

      // Only managers and admins can be team managers
      if (manager.role === 'MEMBER') {
        return NextResponse.json(
          {
            error: 'Invalid manager role',
            message: 'Only managers and admins can be team managers.',
          },
          { status: 400 },
        );
      }
    }

    // Validate parent team if specified
    if (validatedData.parentTeamId) {
      const parentTeam = await prisma.team.findFirst({
        where: {
          id: validatedData.parentTeamId,
          organizationId: dbUser.organizationId,
          isActive: true,
        },
      });

      if (!parentTeam) {
        return NextResponse.json(
          { error: 'Invalid parent team', message: 'Parent team not found or inactive.' },
          { status: 400 },
        );
      }

      // Prevent circular references
      if (validatedData.parentTeamId === params.id) {
        return NextResponse.json(
          { error: 'Invalid parent team', message: 'Team cannot be its own parent.' },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.managerId !== undefined) updateData.managerId = validatedData.managerId;
    if (validatedData.parentTeamId !== undefined) updateData.parentTeamId = validatedData.parentTeamId;
    if (validatedData.teamType) updateData.teamType = validatedData.teamType;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.maxMembers !== undefined) updateData.maxMembers = validatedData.maxMembers;
    if (validatedData.settings) updateData.settings = validatedData.settings;

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: updateData,
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    // Create audit log
    await logUserAction(
      dbUser.organizationId,
      dbUser.id,
      'UPDATE',
      'Team',
      params.id,
      {
        old: {
          name: team.name,
          description: team.description,
          managerId: team.managerId,
          isActive: team.isActive,
        },
        new: updateData,
      },
      request,
    );

    return NextResponse.json({
      message: 'Team updated successfully',
      team: {
        ...updatedTeam,
        memberCount: updatedTeam._count.members,
        members: updatedTeam.members.map((m) => m.user),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, `PATCH /api/admin/teams/${params.id}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/teams/[id]
 * Delete a team
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const result = await requireAuthWithOrganizationAPI();
    if (!result) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required.' },
        { status: 401 },
      );
    }
    const { dbUser } = result;

    if (!canAccessTeamManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to delete teams.' },
        { status: 403 },
      );
    }

    // Find the team
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      include: {
        childTeams: {
          select: { id: true, name: true },
        },
        members: {
          select: { id: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found', message: 'The requested team does not exist.' },
        { status: 404 },
      );
    }

    // Check if manager can only delete their own teams
    if (dbUser.role === 'MANAGER' && !isAdmin(dbUser) && team.managerId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You can only delete teams you manage.' },
        { status: 403 },
      );
    }

    // Check if team has child teams
    if (team.childTeams.length > 0) {
      return NextResponse.json(
        {
          error: 'Team has child teams',
          message: 'Cannot delete team with child teams. Please reassign or delete child teams first.',
        },
        { status: 400 },
      );
    }

    // Use transaction to delete team and all related data
    await prisma.$transaction(async (tx) => {
      // Delete team members
      await tx.teamMember.deleteMany({
        where: { teamId: params.id },
      });

      // Delete team objectives (if any) - remove if Objective model doesn't have teamId
      // await tx.objective.deleteMany({
      //   where: { teamId: params.id },
      // });

      // Delete the team
      await tx.team.delete({
        where: { id: params.id },
      });
    });

    // Create audit log
    await logUserAction(
      dbUser.organizationId,
      dbUser.id,
      'DELETE',
      'Team',
      params.id,
      {
        old: {
          name: team.name,
          description: team.description,
          memberCount: team.members.length,
        },
      },
      request,
    );

    return NextResponse.json({
      message: 'Team deleted successfully',
    });
  } catch (error) {
    logError(error as Error, `DELETE /api/admin/teams/${params.id}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}