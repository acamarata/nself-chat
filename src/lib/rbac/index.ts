/**
 * RBAC Module Barrel Export
 *
 * Re-exports all RBAC types and utilities for convenient importing.
 */

// Types
export {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  type Role,
  type Permission,
  type RolePermissions,
} from '@/types/rbac'

// Permission utilities
export {
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  hasRole,
  canManageRole,
  isOwner,
  canModifyUser,
  getRolePermissions,
  getRoleDisplayName,
  getAllRolesSorted,
} from './permissions'
