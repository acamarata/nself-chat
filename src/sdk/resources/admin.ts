/**
 * Admin Resource
 *
 * API methods for administrative operations (requires admin/owner role).
 */

import { BaseResource } from './base'
import type { User, Channel, PaginatedResult, ListOptions, UUID } from '../types'

/**
 * User Management Options
 */
export interface UpdateUserRoleOptions {
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
}

/**
 * System Stats
 */
export interface SystemStats {
  users: {
    total: number
    active: number
    online: number
  }
  channels: {
    total: number
    public: number
    private: number
  }
  messages: {
    total: number
    today: number
    thisWeek: number
  }
  storage: {
    used: number
    limit: number
  }
}

/**
 * Admin Resource Class
 *
 * @example
 * ```typescript
 * // Get system stats
 * const stats = await client.admin.getStats()
 *
 * // Update user role
 * await client.admin.updateUserRole('user-123', { role: 'moderator' })
 *
 * // Suspend user
 * await client.admin.suspendUser('user-123')
 * ```
 */
export class AdminResource extends BaseResource {
  /**
   * Get system statistics
   */
  async getStats(): Promise<SystemStats> {
    return this.get<SystemStats>('/api/admin/stats')
  }

  /**
   * Get all users (admin view)
   */
  async getUsers(options?: ListOptions): Promise<PaginatedResult<User>> {
    return this.get<PaginatedResult<User>>('/api/admin/users', options)
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: UUID, options: UpdateUserRoleOptions): Promise<User> {
    return this.patch<User>(`/api/admin/users/${userId}/role`, options)
  }

  /**
   * Suspend a user
   */
  async suspendUser(userId: UUID, reason?: string): Promise<void> {
    return this.post<void>(`/api/admin/users/${userId}/suspend`, { reason })
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId: UUID): Promise<void> {
    return this.post<void>(`/api/admin/users/${userId}/unsuspend`)
  }

  /**
   * Delete a user permanently
   */
  async deleteUser(userId: UUID): Promise<void> {
    return this.delete<void>(`/api/admin/users/${userId}`)
  }

  /**
   * Get all channels (admin view)
   */
  async getChannels(options?: ListOptions): Promise<PaginatedResult<Channel>> {
    return this.get<PaginatedResult<Channel>>('/api/admin/channels', options)
  }

  /**
   * Force delete a channel
   */
  async deleteChannel(channelId: UUID): Promise<void> {
    return this.delete<void>(`/api/admin/channels/${channelId}`)
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(options?: ListOptions): Promise<PaginatedResult<unknown>> {
    return this.get<PaginatedResult<unknown>>('/api/admin/audit-logs', options)
  }

  /**
   * Export data
   */
  async exportData(format: 'json' | 'csv'): Promise<{ downloadUrl: string }> {
    return this.post<{ downloadUrl: string }>('/api/admin/export', { format })
  }

  /**
   * Get app configuration
   */
  async getConfig(): Promise<unknown> {
    return this.get<unknown>('/api/admin/config')
  }

  /**
   * Update app configuration
   */
  async updateConfig(config: unknown): Promise<unknown> {
    return this.post<unknown>('/api/admin/config', config)
  }
}
