/**
 * Admin Team Management API
 * TSA-46: Team CRUD, hierarchy, and member management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
// import { withAdminMiddleware } from '@/lib/api-helpers'; // For future use
import { canAccessTeamManagement, isAdmin } from '@/lib/auth/rbac';
import { requireAuthWithOrganizationAPI } from '@/lib/auth/utils';
import { logError } from '@/lib/logger';
import { logUserAction } from '@/lib/audit-log';

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  managerId: z.string().optional(),
  parentTeamId: z.string().optional(),
  teamType: z.enum(['REGULAR', 'DEPARTMENT', 'PROJECT', 'CROSS_FUNCTIONAL']).default('REGULAR'),
  maxMembers: z.number().int().positive().optional(),
  memberIds: z.array(z.string()).default([]),
});

// updateTeamSchema will be used in the [id]/route.ts file
// const updateTeamSchema = z.object({
//   name: z.string().min(1).max(100).optional(),
//   description: z.string().max(500).optional(),
//   managerId: z.string().optional(),
//   parentTeamId: z.string().optional(),
//   teamType: z.enum(['REGULAR', 'DEPARTMENT', 'PROJECT', 'CROSS_FUNCTIONAL']).optional(),
//   isActive: z.boolean().optional(),
//   maxMembers: z.number().int().positive().optional(),
//   settings: z.object({}).optional(),
// });

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val !== undefined && val !== '' ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined && val !== '' ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  managerId: z.string().optional(),
  teamType: z.enum(['REGULAR', 'DEPARTMENT', 'PROJECT', 'CROSS_FUNCTIONAL']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  includeHierarchy: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sortBy: z.enum(['name', 'createdAt', 'memberCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/admin/teams
 * List and search teams with pagination and hierarchy
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId: dbUser.organizationId,
    };

    if (query.search !== undefined && query.search !== '') {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.managerId !== undefined && query.managerId !== '') {
      where['managerId'] = query.managerId;
    }

    if (query.teamType !== undefined) {
      where['teamType'] = query.teamType;
    }

    if (query.isActive !== undefined) {
      where['isActive'] = query.isActive;
    }

    // Managers can only see teams they manage (unless they're admin)
    if (dbUser.role === 'MANAGER' && !isAdmin(dbUser)) {
      where['managerId'] = dbUser.id;
    }

    const orderBy: Record<string, unknown> = {};
    if (query.sortBy === 'memberCount') {
      orderBy['members'] = { _count: query.sortOrder };
    } else {
      orderBy[query.sortBy] = query.sortOrder;
    }

    const [teams, totalCount] = await Promise.all([
      prisma.team.findMany({
        where: where as Record<string, unknown>,
        select: {
          id: true,
          name: true,
          description: true,
          teamType: true,
          isActive: true,
          maxMembers: true,
          createdAt: true,
          updatedAt: true,
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parentTeam: query.includeHierarchy
            ? {
                select: {
                  id: true,
                  name: true,
                },
              }
            : false,
          childTeams: query.includeHierarchy
            ? {
                select: {
                  id: true,
                  name: true,
                  _count: {
                    select: { members: true },
                  },
                },
              }
            : false,
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
        orderBy: orderBy as Record<string, unknown>,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.team.count({ where: where as Record<string, unknown> }),
    ]);

    const totalPages = Math.ceil(totalCount / query.limit);

    // Calculate team hierarchy statistics if requested
    let hierarchyStats = null;
    if (query.includeHierarchy) {
      const [departmentCount, projectCount, regularCount] = await Promise.all([
        prisma.team.count({ where: { ...where, teamType: 'DEPARTMENT' } }),
        prisma.team.count({ where: { ...where, teamType: 'PROJECT' } }),
        prisma.team.count({ where: { ...where, teamType: 'REGULAR' } }),
      ]);

      hierarchyStats = {
        departments: departmentCount,
        projects: projectCount,
        regular: regularCount,
        crossFunctional: totalCount - departmentCount - projectCount - regularCount,
      };
    }

    return NextResponse.json({
      teams: teams.map((team) => ({
        ...team,
        memberCount: team._count.members,
        objectiveCount: team._count.objectives,
        members: team.members.map((m) => ({ ...m.user, joinedAt: m.joinedAt })),
        isAtCapacity: (team.maxMembers !== null && team.maxMembers > 0) ? team._count.members >= team.maxMembers : false,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      hierarchyStats,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'GET /api/admin/teams');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/teams
 * Create a new team with members
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
        { error: 'Access denied', message: 'You do not have permission to create teams.' },
        { status: 403 },
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const validatedData = createTeamSchema.parse(body);

    // Validate manager exists and is in same organization
    if (validatedData.managerId !== undefined && validatedData.managerId !== '') {
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
    if (validatedData.parentTeamId !== undefined && validatedData.parentTeamId !== '') {
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
    }

    // Check for duplicate team name
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: validatedData.name,
        organizationId: dbUser.organizationId,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Duplicate team name', message: 'A team with this name already exists.' },
        { status: 400 },
      );
    }

    // Validate member IDs
    if (validatedData.memberIds.length > 0) {
      const validMembers = await prisma.user.findMany({
        where: {
          id: { in: validatedData.memberIds },
          organizationId: dbUser.organizationId,
          isActive: true,
        },
        select: { id: true },
      });

      if (validatedData.memberIds.length !== validMembers.length) {
        return NextResponse.json(
          { error: 'Invalid members', message: 'Some member IDs are invalid or inactive.' },
          { status: 400 },
        );
      }
    }

    // Create team with transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          managerId: validatedData.managerId,
          parentTeamId: validatedData.parentTeamId,
          teamType: validatedData.teamType,
          maxMembers: validatedData.maxMembers,
          organizationId: dbUser.organizationId,
        },
      });

      // Add members if specified
      if (validatedData.memberIds.length > 0) {
        await tx.teamMember.createMany({
          data: validatedData.memberIds.map((userId) => ({
            teamId: newTeam.id,
            userId,
          })),
        });
      }

      return newTeam;
    });

    // Fetch complete team data for response
    const createdTeam = await prisma.team.findUnique({
      where: { id: transactionResult.id },
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
      'CREATE',
      'Team',
      transactionResult.id,
      {
        new: {
          name: validatedData.name,
          description: validatedData.description,
          teamType: validatedData.teamType,
          managerId: validatedData.managerId,
        },
      },
      request,
    );

    return NextResponse.json(
      {
        message: 'Team created successfully',
        team: {
          ...createdTeam,
          memberCount: createdTeam?._count.members,
          members: createdTeam?.members.map((m) => m.user),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'POST /api/admin/teams');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

