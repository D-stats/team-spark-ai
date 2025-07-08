/**
 * Role-Based Access Control (RBAC) utilities for TeamSpark AI
 * Implements TSA-46 admin authorization requirements
 */

import { Role } from '@prisma/client';

// Type definitions for auth user
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: Role;
  isActive: boolean;
}

// Permission constants
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  CHANGE_USER_ROLES: 'change_user_roles',
  DEACTIVATE_USERS: 'deactivate_users',
  INVITE_USERS: 'invite_users',
  BULK_USER_OPERATIONS: 'bulk_user_operations',
  EXPORT_USERS: 'export_users',

  // Team management
  VIEW_TEAMS: 'view_teams',
  CREATE_TEAMS: 'create_teams',
  UPDATE_TEAMS: 'update_teams',
  DELETE_TEAMS: 'delete_teams',
  MANAGE_TEAM_MEMBERS: 'manage_team_members',
  BULK_TEAM_OPERATIONS: 'bulk_team_operations',
  EXPORT_TEAMS: 'export_teams',

  // Organization management
  VIEW_ORGANIZATION: 'view_organization',
  UPDATE_ORGANIZATION: 'update_organization',
  MANAGE_BILLING: 'manage_billing',
  MANAGE_FEATURES: 'manage_features',
  MANAGE_BRANDING: 'manage_branding',
  VIEW_USAGE_STATS: 'view_usage_stats',

  // Audit and compliance
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',
  MANAGE_COMPLIANCE: 'manage_compliance',

  // System admin
  MANAGE_SYSTEM: 'manage_system',
  VIEW_ALL_ORGANIZATIONS: 'view_all_organizations',
} as const;

// Role-based permission matrix
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  [Role.MANAGER]: [
    // User management (limited)
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.UPDATE_USERS, // Limited to their team members
    PERMISSIONS.EXPORT_USERS,

    // Team management
    PERMISSIONS.VIEW_TEAMS,
    PERMISSIONS.CREATE_TEAMS,
    PERMISSIONS.UPDATE_TEAMS, // Limited to teams they manage
    PERMISSIONS.MANAGE_TEAM_MEMBERS, // Limited to teams they manage
    PERMISSIONS.EXPORT_TEAMS,

    // Organization (view only)
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.VIEW_USAGE_STATS,

    // Audit (limited)
    PERMISSIONS.VIEW_AUDIT_LOGS, // Limited to their actions and teams
  ],
  [Role.MEMBER]: [
    // Very limited permissions
    PERMISSIONS.VIEW_ORGANIZATION,
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  if (!user.isActive) {
    return false;
  }

  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (!rolePermissions) {
    return false;
  }
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if user has the required role or higher
 */
export function hasRole(user: AuthUser, requiredRole: Role): boolean {
  if (!user.isActive) {
    return false;
  }

  const roleHierarchy = {
    [Role.MEMBER]: 0,
    [Role.MANAGER]: 1,
    [Role.ADMIN]: 2,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can manage users (admin or manager with proper permissions)
 */
export function canManageUsers(user: AuthUser): boolean {
  return (
    hasPermission(user, PERMISSIONS.CREATE_USERS) ||
    hasPermission(user, PERMISSIONS.UPDATE_USERS) ||
    hasPermission(user, PERMISSIONS.DELETE_USERS)
  );
}

/**
 * Check if user can manage teams
 */
export function canManageTeams(user: AuthUser): boolean {
  return (
    hasPermission(user, PERMISSIONS.CREATE_TEAMS) ||
    hasPermission(user, PERMISSIONS.UPDATE_TEAMS) ||
    hasPermission(user, PERMISSIONS.DELETE_TEAMS)
  );
}

/**
 * Check if user can manage organization settings
 */
export function canManageOrganization(user: AuthUser): boolean {
  return hasPermission(user, PERMISSIONS.UPDATE_ORGANIZATION);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === Role.ADMIN && user.isActive;
}

/**
 * Check if user is manager or higher
 */
export function isManagerOrHigher(user: AuthUser): boolean {
  return hasRole(user, Role.MANAGER);
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdminPanel(user: AuthUser): boolean {
  return isManagerOrHigher(user);
}

/**
 * Check if user can access user management
 */
export function canAccessUserManagement(user: AuthUser): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.UPDATE_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.INVITE_USERS,
  ]);
}

/**
 * Check if user can access team management
 */
export function canAccessTeamManagement(user: AuthUser): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.VIEW_TEAMS,
    PERMISSIONS.CREATE_TEAMS,
    PERMISSIONS.UPDATE_TEAMS,
    PERMISSIONS.DELETE_TEAMS,
  ]);
}

/**
 * Check if user can access organization management
 */
export function canAccessOrganizationManagement(user: AuthUser): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.VIEW_ORGANIZATION,
    PERMISSIONS.UPDATE_ORGANIZATION,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.MANAGE_FEATURES,
  ]);
}

/**
 * Check if user can access audit logs
 */
export function canAccessAuditLogs(user: AuthUser): boolean {
  return hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS);
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: AuthUser): string[] {
  if (!user.isActive) {
    return [];
  }

  const rolePermissions = ROLE_PERMISSIONS[user.role];
  return rolePermissions ?? [];
}

/**
 * Check if user can perform bulk operations
 */
export function canPerformBulkOperations(user: AuthUser): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.BULK_USER_OPERATIONS,
    PERMISSIONS.BULK_TEAM_OPERATIONS,
  ]);
}

/**
 * Check if user can export data
 */
export function canExportData(user: AuthUser): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.EXPORT_USERS,
    PERMISSIONS.EXPORT_TEAMS,
    PERMISSIONS.EXPORT_AUDIT_LOGS,
  ]);
}

/**
 * Context-aware permission checking for user management
 * Managers can only manage users in their teams
 */
export function canManageSpecificUser(
  currentUser: AuthUser,
  targetUserId: string,
  _targetUserTeamIds: string[] = [],
): boolean {
  // Admins can manage anyone
  if (isAdmin(currentUser)) {
    return true;
  }

  // Users cannot manage themselves for role changes
  if (currentUser.id === targetUserId) {
    return false;
  }

  // Managers can manage users in their teams
  if (currentUser.role === Role.MANAGER) {
    // This would need to be enhanced with actual team manager relationships
    // For now, return true if user has basic permission
    return hasPermission(currentUser, PERMISSIONS.UPDATE_USERS);
  }

  return false;
}

/**
 * Context-aware permission checking for team management
 * Managers can only manage teams they are assigned to manage
 */
export function canManageSpecificTeam(
  currentUser: AuthUser,
  _teamId: string,
  teamManagerId?: string,
): boolean {
  // Admins can manage any team
  if (isAdmin(currentUser)) {
    return true;
  }

  // Team managers can manage their own teams
  if (currentUser.role === Role.MANAGER && teamManagerId === currentUser.id) {
    return true;
  }

  // Other managers can create teams but not manage existing ones they don't own
  if (currentUser.role === Role.MANAGER) {
    return hasPermission(currentUser, PERMISSIONS.CREATE_TEAMS);
  }

  return false;
}

/**
 * Create a permission checker function for a specific user
 * Useful for components that need to check multiple permissions
 */
export function createPermissionChecker(user: AuthUser): {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: Role) => boolean;
  canManageUsers: () => boolean;
  canManageTeams: () => boolean;
  canManageOrganization: () => boolean;
  canAccessAdminPanel: () => boolean;
  canAccessUserManagement: () => boolean;
  canAccessTeamManagement: () => boolean;
  canAccessOrganizationManagement: () => boolean;
  canAccessAuditLogs: () => boolean;
  canPerformBulkOperations: () => boolean;
  canExportData: () => boolean;
  isAdmin: () => boolean;
  isManagerOrHigher: () => boolean;
} {
  return {
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasRole: (role: Role) => hasRole(user, role),
    canManageUsers: () => canManageUsers(user),
    canManageTeams: () => canManageTeams(user),
    canManageOrganization: () => canManageOrganization(user),
    canAccessAdminPanel: () => canAccessAdminPanel(user),
    canAccessUserManagement: () => canAccessUserManagement(user),
    canAccessTeamManagement: () => canAccessTeamManagement(user),
    canAccessOrganizationManagement: () => canAccessOrganizationManagement(user),
    canAccessAuditLogs: () => canAccessAuditLogs(user),
    canPerformBulkOperations: () => canPerformBulkOperations(user),
    canExportData: () => canExportData(user),
    isAdmin: () => isAdmin(user),
    isManagerOrHigher: () => isManagerOrHigher(user),
  };
}
