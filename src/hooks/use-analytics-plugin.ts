/**
 * Analytics Plugin Hooks
 * React hooks for using Analytics plugin functionality
 */

import useSWR from 'swr'
import { useState, useCallback } from 'react'
import {
  analyticsService,
  type AnalyticsDashboard,
  type UserAnalytics,
  type ChannelAnalytics,
  type AnalyticsEvent,
  type HealthCheck,
} from '@/services/plugins/analytics.service'

interface UseAnalyticsDashboardOptions {
  period?: string
  refreshInterval?: number
}

export function useAnalyticsDashboard(options: UseAnalyticsDashboardOptions = {}) {
  const { period = '30d', refreshInterval = 30000 } = options

  const { data, error, isLoading, mutate } = useSWR<AnalyticsDashboard>(
    `/analytics/dashboard/${period}`,
    () => analyticsService.getDashboard(period),
    { refreshInterval }
  )

  return {
    dashboard: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

interface UseUserAnalyticsOptions {
  period?: string
  limit?: number
  refreshInterval?: number
}

export function useUserAnalytics(options: UseUserAnalyticsOptions = {}) {
  const { period = '7d', limit = 100, refreshInterval = 60000 } = options

  const { data, error, isLoading, mutate } = useSWR<UserAnalytics[]>(
    `/analytics/users/${period}/${limit}`,
    () => analyticsService.getUserAnalytics(period, limit),
    { refreshInterval }
  )

  return {
    users: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

interface UseChannelAnalyticsOptions {
  limit?: number
  refreshInterval?: number
}

export function useChannelAnalytics(options: UseChannelAnalyticsOptions = {}) {
  const { limit = 20, refreshInterval = 60000 } = options

  const { data, error, isLoading, mutate } = useSWR<ChannelAnalytics[]>(
    `/analytics/channels/${limit}`,
    () => analyticsService.getChannelAnalytics(limit),
    { refreshInterval }
  )

  return {
    channels: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useAnalyticsTracking() {
  const [isTracking, setIsTracking] = useState(false)

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    setIsTracking(true)
    try {
      const result = await analyticsService.trackEvent(event)
      return result
    } catch (error) {
      console.error('Failed to track event:', error)
      throw error
    } finally {
      setIsTracking(false)
    }
  }, [])

  const trackEvents = useCallback(async (events: AnalyticsEvent[]) => {
    setIsTracking(true)
    try {
      const result = await analyticsService.trackEvents(events)
      return result
    } catch (error) {
      console.error('Failed to track events:', error)
      throw error
    } finally {
      setIsTracking(false)
    }
  }, [])

  return {
    trackEvent,
    trackEvents,
    isTracking,
  }
}

export function useAnalyticsHealth() {
  const { data, error, isLoading, mutate } = useSWR<HealthCheck>(
    '/analytics/health',
    () => analyticsService.checkHealth(),
    { refreshInterval: 30000 }
  )

  return {
    health: data,
    isHealthy: data?.status === 'healthy',
    isLoading,
    error,
    checkHealth: mutate,
  }
}
