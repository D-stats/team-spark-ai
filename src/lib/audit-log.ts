/**
 * Audit Logging Service
 * TSA-46: Activity logging and audit trail for admin actions
 */

import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';
import { logError } from '@/lib/logger';

export interface CreateAuditLogData {
  organizationId: string;
  userId?: string; // Null for system actions
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: CreateAuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    // Don't throw errors from audit logging - log them instead
    logError(error as Error, 'Failed to create audit log');
  }
}

/**
 * Create audit log for user actions
 */
export async function logUserAction(
  organizationId: string,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  changes?: { old?: any; new?: any },
  request?: Request,
): Promise<void> {
  const ipAddress =
    request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';

  await createAuditLog({
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    oldValues: changes?.old,
    newValues: changes?.new,
    ipAddress,
    userAgent,
  });
}

/**
 * Create audit log for system actions
 */
export async function logSystemAction(
  organizationId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  changes?: { old?: any; new?: any },
): Promise<void> {
  await createAuditLog({
    organizationId,
    action,
    entityType,
    entityId,
    oldValues: changes?.old,
    newValues: changes?.new,
  });
}

/**
 * Create audit log for failed actions
 */
export async function logFailedAction(
  organizationId: string,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  errorMessage: string,
  request?: Request,
): Promise<void> {
  const ipAddress =
    request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';

  await createAuditLog({
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    success: false,
    errorMessage,
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs with filtering and pagination
 */
export interface AuditLogQuery {
  organizationId: string;
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'entityType';
  sortOrder?: 'asc' | 'desc';
}

export async function getAuditLogs(query: AuditLogQuery) {
  const {
    organizationId,
    userId,
    action,
    entityType,
    entityId,
    success,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const where: any = { organizationId };

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (success !== undefined) where.success = success;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      oldValues: log.oldValues ? JSON.parse(log.oldValues as string) : null,
      newValues: log.newValues ? JSON.parse(log.newValues as string) : null,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(organizationId: string, startDate?: Date, endDate?: Date) {
  const where: any = { organizationId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [totalLogs, successfulActions, failedActions, actionBreakdown, userActivity] =
    await Promise.all([
      // Total log count
      prisma.auditLog.count({ where }),

      // Successful actions
      prisma.auditLog.count({ where: { ...where, success: true } }),

      // Failed actions
      prisma.auditLog.count({ where: { ...where, success: false } }),

      // Action breakdown
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
      }),

      // Top active users
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

  // Get user details for top active users
  const userIds = userActivity.map((u) => u.userId).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    totalLogs,
    successfulActions,
    failedActions,
    successRate: totalLogs > 0 ? Math.round((successfulActions / totalLogs) * 100) : 0,
    actionBreakdown: actionBreakdown.map((item) => ({
      action: item.action,
      count: item._count.action,
    })),
    topActiveUsers: userActivity
      .map((item) => ({
        user: item.userId ? userMap.get(item.userId) : null,
        actionCount: item._count.userId,
      }))
      .filter((item) => item.user),
  };
}

/**
 * Clean up old audit logs based on retention policy
 */
export async function cleanupAuditLogs(
  organizationId: string,
  retentionDays: number = 365,
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      organizationId,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogs(
  organizationId: string,
  query: Omit<AuditLogQuery, 'page' | 'limit'>,
): Promise<string> {
  const { logs } = await getAuditLogs({
    ...query,
    organizationId,
    limit: 10000, // Large limit for export
  });

  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Entity Type',
    'Entity ID',
    'Success',
    'IP Address',
    'User Agent',
    'Error Message',
  ];

  const rows = logs.map((log) => [
    log.createdAt.toISOString(),
    log.user?.name || log.user?.email || 'System',
    log.action,
    log.entityType,
    log.entityId,
    log.success ? 'Success' : 'Failed',
    log.ipAddress || '',
    log.userAgent || '',
    log.errorMessage || '',
  ]);

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell,
        )
        .join(','),
    ),
  ].join('\n');

  return csvContent;
}
