/**
 * Admin Organization Management API
 * TSA-46: Organization profile editing, billing, features, and settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { canAccessOrganizationManagement, isAdmin } from '@/lib/auth/rbac';
import { logError } from '@/lib/logger';
import { logUserAction } from '@/lib/audit-log';

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  billingAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  planType: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  maxUsers: z.number().int().positive().optional(),
  enabledFeatures: z.array(z.string()).optional(),
  branding: z
    .object({
      logoUrl: z.string().url().optional().or(z.literal('')),
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .or(z.literal('')),
      secondaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .or(z.literal('')),
      companyName: z.string().optional(),
    })
    .optional(),
  complianceSettings: z
    .object({
      dataRetentionDays: z.number().int().positive().optional(),
      gdprEnabled: z.boolean().optional(),
      auditLogRetentionDays: z.number().int().positive().optional(),
    })
    .optional(),
});

/**
 * GET /api/admin/organization
 * Get organization details and settings
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!canAccessOrganizationManagement(dbUser)) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to view organization settings.',
        },
        { status: 403 },
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastActiveAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        teams: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            _count: {
              select: { members: true },
            },
          },
          where: { isActive: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Calculate usage statistics
    const activeUsers = organization.users.filter((u) => u.isActive).length;
    const totalTeams = organization.teams.length;
    const usagePercentage =
      organization.maxUsers != null && organization.maxUsers > 0
        ? Math.round((activeUsers / organization.maxUsers) * 100)
        : 0;

    const response = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billingEmail: organization.billingEmail,
      billingAddress: organization.billingAddress,
      planType: organization.planType,
      planExpiredAt: organization.planExpiredAt,
      maxUsers: organization.maxUsers,
      enabledFeatures: organization.enabledFeatures,
      branding: organization.branding,
      complianceSettings: organization.complianceSettings,
      settings: organization.settings,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      stats: {
        activeUsers,
        totalUsers: organization.users.length,
        totalTeams,
        usagePercentage,
        recentUsers: organization.users.slice(0, 5),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logError(error as Error, 'GET /api/admin/organization');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/organization
 * Update organization settings
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!canAccessOrganizationManagement(dbUser)) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to update organization settings.',
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const validationResult = updateOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const validatedData = validationResult.data;

    // Get current organization data for audit log
    const originalOrganization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
      select: {
        name: true,
        billingEmail: true,
        billingAddress: true,
        planType: true,
        maxUsers: true,
        enabledFeatures: true,
        branding: true,
        complianceSettings: true,
      },
    });

    // Create a mutable copy for admin restrictions
    const updateData = { ...validatedData };

    // Only admins can change billing, plan, and max users
    if (!isAdmin(dbUser)) {
      delete updateData.billingEmail;
      delete updateData.billingAddress;
      delete updateData.planType;
      delete updateData.maxUsers;
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: dbUser.organizationId },
      data: updateData,
    });

    // Revalidate dashboard layout to refresh organization data in header
    revalidatePath('/en/dashboard');
    revalidatePath('/ja/dashboard');
    revalidatePath('/en/dashboard/admin');
    revalidatePath('/ja/dashboard/admin');

    // Create audit log
    await logUserAction(
      dbUser.organizationId,
      dbUser.id,
      'UPDATE',
      'Organization',
      dbUser.organizationId,
      {
        old: originalOrganization,
        new: updateData,
      },
      request,
    );

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: updatedOrganization,
    });
  } catch (error) {
    logError(error as Error, 'PUT /api/admin/organization');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Functions are already exported inline above
