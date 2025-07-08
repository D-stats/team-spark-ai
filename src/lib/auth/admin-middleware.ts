/**
 * Admin middleware for protecting admin routes with role-based access control
 * Implements TSA-46 admin route protection requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import {
  isAdmin,
  canAccessAdminPanel,
  canAccessUserManagement,
  canAccessTeamManagement,
  canAccessOrganizationManagement,
  canAccessAuditLogs,
  AuthUser,
} from './rbac';

// Admin route patterns and their required permissions
const ADMIN_ROUTES = {
  // Admin panel root
  '/admin': canAccessAdminPanel,
  '/dashboard/admin': canAccessAdminPanel,

  // User management
  '/admin/users': canAccessUserManagement,
  '/dashboard/admin/users': canAccessUserManagement,

  // Team management
  '/admin/teams': canAccessTeamManagement,
  '/dashboard/admin/teams': canAccessTeamManagement,

  // Organization management
  '/admin/organization': canAccessOrganizationManagement,
  '/dashboard/admin/organization': canAccessOrganizationManagement,

  // Audit logs
  '/admin/audit': canAccessAuditLogs,
  '/dashboard/admin/audit': canAccessAuditLogs,

  // System admin (admin only)
  '/admin/system': isAdmin,
  '/dashboard/admin/system': isAdmin,
} as const;

// API route patterns and their required permissions
const ADMIN_API_ROUTES = {
  // User management APIs
  '/api/admin/users': canAccessUserManagement,
  '/api/admin/users/invite': canAccessUserManagement,
  '/api/admin/users/bulk': canAccessUserManagement,
  '/api/admin/users/export': canAccessUserManagement,

  // Team management APIs
  '/api/admin/teams': canAccessTeamManagement,
  '/api/admin/teams/bulk': canAccessTeamManagement,
  '/api/admin/teams/export': canAccessTeamManagement,

  // Organization APIs
  '/api/admin/organization': canAccessOrganizationManagement,
  '/api/admin/organization/settings': canAccessOrganizationManagement,
  '/api/admin/organization/billing': isAdmin, // Admin only
  '/api/admin/organization/features': isAdmin, // Admin only

  // Audit APIs
  '/api/admin/audit': canAccessAuditLogs,
  '/api/admin/audit/export': canAccessAuditLogs,

  // Bulk operations
  '/api/admin/bulk': canAccessUserManagement, // Base permission

  // System APIs (admin only)
  '/api/admin/system': isAdmin,
} as const;

/**
 * Check if a path requires admin access
 */
export function requiresAdminAccess(pathname: string): boolean {
  // Remove locale prefix if present
  const pathWithoutLocale = pathname.replace(/^\/(ja|en)/, '');

  return (
    Object.keys(ADMIN_ROUTES).some((route) => pathWithoutLocale.startsWith(route)) ||
    Object.keys(ADMIN_API_ROUTES).some((route) => pathWithoutLocale.startsWith(route))
  );
}

/**
 * Check if a path requires manager or higher access
 */
export function requiresManagerAccess(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(ja|en)/, '');

  // Most admin routes require at least manager access
  return Object.keys(ADMIN_ROUTES).some((route) => pathWithoutLocale.startsWith(route));
}

/**
 * Check if user has access to a specific admin path
 */
export function hasAdminPathAccess(user: AuthUser, pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(ja|en)/, '');

  // Check exact matches first
  for (const [route, checker] of Object.entries(ADMIN_ROUTES)) {
    if (pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)) {
      return checker(user);
    }
  }

  // Check API routes
  for (const [route, checker] of Object.entries(ADMIN_API_ROUTES)) {
    if (pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)) {
      return checker(user);
    }
  }

  // If no specific route matched, check if it's under admin and require basic access
  if (pathWithoutLocale.includes('/admin')) {
    return canAccessAdminPanel(user);
  }

  return true; // Non-admin routes are accessible
}

/**
 * Create admin middleware for Next.js middleware
 */
export function createAdminMiddleware() {
  return async function adminMiddleware(
    request: NextRequest,
    user: AuthUser | null,
  ): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;

    // Skip if not an admin route
    if (!requiresAdminAccess(pathname)) {
      return null; // Continue to next middleware
    }

    // Require authentication for admin routes
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has access to this specific path
    if (!hasAdminPathAccess(user, pathname)) {
      // Return 403 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Access denied',
            message: 'You do not have permission to access this resource.',
            code: 'INSUFFICIENT_PERMISSIONS',
          },
          { status: 403 },
        );
      }

      // Redirect to access denied page for UI routes
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('reason', 'insufficient_permissions');
      return NextResponse.redirect(accessDeniedUrl);
    }

    // User has access, continue
    return null;
  };
}

/**
 * Higher-order function to protect API routes with admin access
 * Simplified version for basic functionality
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: AuthUser, context?: unknown) => Promise<NextResponse>,
  options: {
    requiredRole?: Role;
    customChecker?: (user: AuthUser) => boolean;
  } = {},
) {
  return async function protectedHandler(
    request: NextRequest,
    context?: unknown,
  ): Promise<NextResponse> {
    // This would be integrated with the main auth system
    // For now, return a placeholder implementation

    // TODO: Get user from session/token
    // const user = await getUserFromRequest(request);

    // Placeholder user for development - this should be replaced with real auth
    const user: AuthUser = {
      id: 'dev-user-id',
      email: 'admin@example.com',
      name: 'Development Admin',
      organizationId: 'dev-org-id',
      role: Role.ADMIN,
      isActive: true,
    };

    // Check role requirement
    if (options.requiredRole) {
      if (user.role !== options.requiredRole) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            message: `This resource requires ${options.requiredRole} role.`,
            code: 'INSUFFICIENT_ROLE',
          },
          { status: 403 },
        );
      }
    }

    // Check custom permission
    if (options.customChecker && !options.customChecker(user)) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to perform this action.',
          code: 'CUSTOM_PERMISSION_DENIED',
        },
        { status: 403 },
      );
    }

    // Check path-specific permissions
    if (!hasAdminPathAccess(user, request.nextUrl.pathname)) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have permission to access this resource.',
          code: 'PATH_PERMISSION_DENIED',
        },
        { status: 403 },
      );
    }

    return handler(request, user, context);
  };
}

/**
 * Helper to check admin access in React components
 */
export function useAdminAccess(
  user: AuthUser | null,
  path?: string,
): {
  canAccessAdminPanel: boolean;
  canAccessUserManagement: boolean;
  canAccessTeamManagement: boolean;
  canAccessOrganizationManagement: boolean;
  canAccessAuditLogs: boolean;
  hasPathAccess: boolean;
} {
  if (!user) {
    return {
      canAccessAdminPanel: false,
      canAccessUserManagement: false,
      canAccessTeamManagement: false,
      canAccessOrganizationManagement: false,
      canAccessAuditLogs: false,
      hasPathAccess: false,
    };
  }

  return {
    canAccessAdminPanel: canAccessAdminPanel(user),
    canAccessUserManagement: canAccessUserManagement(user),
    canAccessTeamManagement: canAccessTeamManagement(user),
    canAccessOrganizationManagement: canAccessOrganizationManagement(user),
    canAccessAuditLogs: canAccessAuditLogs(user),
    hasPathAccess: path != null ? hasAdminPathAccess(user, path) : true,
  };
}

/**
 * Route configuration for admin navigation
 */
export const ADMIN_NAVIGATION = [
  {
    title: 'Dashboard',
    href: '/dashboard/admin',
    permission: canAccessAdminPanel,
    icon: 'dashboard',
  },
  {
    title: 'User Management',
    href: '/dashboard/admin/users',
    permission: canAccessUserManagement,
    icon: 'users',
  },
  {
    title: 'Team Management',
    href: '/dashboard/admin/teams',
    permission: canAccessTeamManagement,
    icon: 'teams',
  },
  {
    title: 'Organization Management',
    href: '/dashboard/admin/organization',
    permission: canAccessOrganizationManagement,
    icon: 'organization',
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/admin/audit',
    permission: canAccessAuditLogs,
    icon: 'audit',
  },
] as const;

/**
 * Get navigation items that user has access to
 */
export function getAccessibleAdminNavigation(user: AuthUser): Array<{
  title: string;
  href: string;
  permission: (user: AuthUser) => boolean;
  icon: string;
}> {
  return ADMIN_NAVIGATION.filter((item) => item.permission(user));
}
