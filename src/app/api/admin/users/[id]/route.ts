/**
 * Admin Individual User Management API
 * TSA-46: Update, delete, and manage specific users
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
// import { withAdminMiddleware } from '@/lib/api-helpers'; // For future use
import { canAccessUserManagement, isAdmin, canManageSpecificUser } from '@/lib/auth/rbac';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { logError } from '@/lib/logger';
import { logUserAction } from '@/lib/audit-log';

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional(),
  isActive: z.boolean().optional(),
  deactivationReason: z.string().optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  phoneNumber: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  emailNotifications: z.boolean().optional(),
  kudosNotifications: z.boolean().optional(),
  checkinReminders: z.boolean().optional(),
  surveyNotifications: z.boolean().optional(),
  teamUpdates: z.boolean().optional(),
  digestFrequency: z.enum(['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  // Admin-only fields
  lastRoleChange: z.date().optional(),
  lastRoleChangedBy: z.string().optional(),
  deactivatedAt: z.date().optional().nullable(),
  deactivatedById: z.string().optional().nullable(),
});

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!canAccessUserManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to view user details.' },
        { status: 403 },
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      include: {
        teamMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                description: true,
                managerId: true,
              },
            },
          },
        },
        managedTeams: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: { members: true },
            },
          },
        },
        loginHistory: {
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            success: true,
            loginAt: true,
          },
          orderBy: { loginAt: 'desc' },
          take: 10,
        },
        userSessions: {
          select: {
            id: true,
            deviceInfo: true,
            ipAddress: true,
            isActive: true,
            lastUsedAt: true,
            createdAt: true,
          },
          where: { isActive: true },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sentKudos: true,
            receivedKudos: true,
            checkIns: true,
            surveyResponses: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can view this specific user
    const teamIds = targetUser.teamMemberships.map((tm) => tm.team.id);
    if (!canManageSpecificUser(dbUser, targetUser.id, teamIds)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to view this user.' },
        { status: 403 },
      );
    }

    // Clean up response data
    const response = {
      ...targetUser,
      password: undefined, // Never return password
      twoFactorSecret: undefined, // Never return 2FA secret
      teams: targetUser.teamMemberships.map((tm) => tm.team),
      teamMemberships: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    logError(error as Error, `GET /api/admin/users/${params.id}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!canAccessUserManagement(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to update users.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Get current user data
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        deactivatedAt: true,
        deactivationReason: true,
        teamMemberships: {
          select: { team: { select: { id: true } } },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions for this specific user
    const teamIds = targetUser.teamMemberships.map((tm) => tm.team.id);
    if (!canManageSpecificUser(dbUser, targetUser.id, teamIds)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to update this user.' },
        { status: 403 },
      );
    }

    // Role change restrictions
    if (validatedData.role && validatedData.role !== targetUser.role) {
      // Only admins can change roles
      if (!isAdmin(dbUser)) {
        return NextResponse.json(
          { error: 'Access denied', message: 'Only admins can change user roles.' },
          { status: 403 },
        );
      }

      // Only admins can create other admins
      if (validatedData.role === 'ADMIN' && !isAdmin(dbUser)) {
        return NextResponse.json(
          { error: 'Access denied', message: 'Only admins can promote users to admin.' },
          { status: 403 },
        );
      }

      // Cannot change own role
      if (targetUser.id === dbUser.id) {
        return NextResponse.json(
          { error: 'Access denied', message: 'You cannot change your own role.' },
          { status: 403 },
        );
      }

      validatedData.lastRoleChange = new Date();
      validatedData.lastRoleChangedBy = dbUser.id;
    }

    // Handle deactivation
    if (validatedData.isActive === false && targetUser.isActive) {
      // Cannot deactivate yourself
      if (targetUser.id === dbUser.id) {
        return NextResponse.json(
          { error: 'Access denied', message: 'You cannot deactivate yourself.' },
          { status: 403 },
        );
      }

      validatedData.deactivatedAt = new Date();
      validatedData.deactivatedById = dbUser.id;
    } else if (validatedData.isActive === true && !targetUser.isActive) {
      // Reactivating user
      (validatedData as any).deactivatedAt = null;
      (validatedData as any).deactivatedById = null;
      (validatedData as any).deactivationReason = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
        lastRoleChange: true,
        deactivatedAt: true,
        deactivationReason: true,
      },
    });

    // Create audit log
    await logUserAction(
      dbUser.organizationId,
      dbUser.id,
      'UPDATE',
      'User',
      params.id,
      {
        old: {
          name: targetUser.name,
          role: targetUser.role,
          isActive: targetUser.isActive,
        },
        new: {
          name: validatedData.name,
          role: validatedData.role,
          isActive: validatedData.isActive,
        },
      },
      request,
    );

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }

    logError(error as Error, `PUT /api/admin/users/${params.id}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete by deactivation)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!isAdmin(dbUser)) {
      return NextResponse.json(
        { error: 'Access denied', message: 'Only admins can delete users.' },
        { status: 403 },
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        organizationId: dbUser.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot delete yourself
    if (targetUser.id === dbUser.id) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You cannot delete yourself.' },
        { status: 403 },
      );
    }

    // Soft delete by deactivation
    await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedById: dbUser.id,
        deactivationReason: 'Deleted by admin',
      },
    });

    // Create audit log
    await logUserAction(
      dbUser.organizationId,
      dbUser.id,
      'DELETE',
      'User',
      params.id,
      {
        old: {
          name: targetUser.name,
          email: targetUser.email,
          isActive: true,
        },
        new: {
          isActive: false,
          deactivationReason: 'Deleted by admin',
        },
      },
      request,
    );

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    logError(error as Error, `DELETE /api/admin/users/${params.id}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

