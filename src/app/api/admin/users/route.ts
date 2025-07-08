/**
 * Admin User Management API
 * TSA-46: User CRUD, role management, bulk operations, and invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
// import { withAdminMiddleware } from '@/lib/api-helpers'; // For future use
import { canAccessUserManagement, isAdmin } from '@/lib/auth/rbac';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { logError } from '@/lib/logger';
import { logUserAction } from '@/lib/audit-log';
import bcrypt from 'bcryptjs';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
  password: z.string().min(8).optional(),
  sendInvitation: z.boolean().default(true),
});

// updateUserSchema will be used in the [id]/route.ts file
// const updateUserSchema = z.object({
//   name: z.string().min(1).max(100).optional(),
//   role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
//   isActive: z.boolean().optional(),
//   deactivationReason: z.string().optional(),
//   bio: z.string().max(500).optional(),
//   skills: z.array(z.string()).optional(),
//   timezone: z.string().optional(),
//   locale: z.string().optional(),
//   phoneNumber: z.string().optional(),
//   linkedinUrl: z.string().url().optional(),
//   githubUrl: z.string().url().optional(),
//   twitterUrl: z.string().url().optional(),
// });

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  sortBy: z.enum(['name', 'email', 'role', 'createdAt', 'lastActiveAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/admin/users
 * List and search users with pagination
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!canAccessUserManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to view users.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const where: any = {
      organizationId: dbUser.organizationId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Managers can only see their team members (unless they're admin)
    if (dbUser.role === 'MANAGER' && !isAdmin(dbUser)) {
      // TODO: Add team relationship filtering
      // where.teamMemberships = { some: { team: { managerId: dbUser.id } } };
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          lastActiveAt: true,
          createdAt: true,
          invitedAt: true,
          deactivatedAt: true,
          deactivationReason: true,
          teamMemberships: {
            select: {
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              sentKudos: true,
              receivedKudos: true,
            },
          },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / query.limit);

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        teams: user.teamMemberships.map((tm) => tm.team),
        teamMemberships: undefined, // Remove nested data
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, 'GET /api/admin/users');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user (with optional invitation)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!canAccessUserManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to create users.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Only admins can create other admins
    if (validatedData.role === 'ADMIN' && !isAdmin(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'Only admins can create admin users.' },
        { status: 403 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists', message: 'A user with this email already exists.' },
        { status: 409 },
      );
    }

    // Check organization user limit
    const organization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
      select: { maxUsers: true, _count: { select: { users: true } } },
    });

    if (organization?.maxUsers && organization._count.users >= organization.maxUsers) {
      return NextResponse.json(
        { error: 'User limit reached', message: 'Organization has reached maximum user limit.' },
        { status: 403 },
      );
    }

    // Create user
    const userData: any = {
      email: validatedData.email,
      name: validatedData.name,
      role: validatedData.role,
      organizationId: dbUser.organizationId,
      invitedById: dbUser.id,
      invitedAt: new Date(),
    };

    // If password provided, hash it; otherwise they'll need to set it via invitation
    if (validatedData.password) {
      userData.password = await bcrypt.hash(validatedData.password, 12);
    }

    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        invitedAt: true,
      },
    });

    // TODO: Send invitation email if requested
    if (validatedData.sendInvitation && !validatedData.password) {
      // await sendUserInvitation(newUser.email, newUser.id, dbUser.organizationId);
    }

    // Create audit log
    await logUserAction(
      dbUser.organizationId,
      dbUser.id,
      'CREATE',
      'User',
      newUser.id,
      {
        new: {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      },
      request,
    );

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: newUser,
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

    logError(error as Error, 'POST /api/admin/users');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

