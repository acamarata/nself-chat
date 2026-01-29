'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  hasPermission,
  hasRole,
  canManageRole,
  canModifyUser,
  isOwner,
  getRolePermissions,
  type Permission,
  type Role,
} from '@/lib/rbac'

/**
 * React hook for checking user permissions
 *
 * @example
 * ```tsx
 * const { hasPermission, hasRole, isOwner, role } = usePermission()
 *
 * if (hasPermission(PERMISSIONS.CHANNEL_CREATE)) {
 *   // Show create channel button
 * }
 *
 * if (hasRole('moderator')) {
 *   // Show moderation tools
 * }
 * ```
 */
export function usePermission() {
  const { user } = useAuth()
  const userRole = (user?.role || 'guest') as Role

  const check = useMemo(
    () => ({
      /**
       * Check if the current user has a specific permission
       */
      hasPermission: (permission: Permission) =>
        hasPermission(userRole, permission),

      /**
       * Check if the current user's role is at or above the required role
       */
      hasRole: (role: Role) => hasRole(userRole, role),

      /**
       * Check if the current user can manage (assign/modify) a target role
       */
      canManageRole: (targetRole: Role) => canManageRole(userRole, targetRole),

      /**
       * Check if the current user can perform a modification action on another user
       */
      canModifyUser: (
        targetRole: Role,
        action: 'delete' | 'demote' | 'ban'
      ) => canModifyUser(userRole, targetRole, action),

      /**
       * Check if the current user is an owner
       */
      isOwner: isOwner(userRole),

      /**
       * Get all permissions for the current user's role
       */
      permissions: getRolePermissions(userRole),

      /**
       * The current user's role
       */
      role: userRole,
    }),
    [userRole]
  )

  return check
}

export type UsePermissionReturn = ReturnType<typeof usePermission>
