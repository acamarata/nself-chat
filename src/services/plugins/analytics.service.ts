/**
 * Analytics Plugin Service
 * Client-side service for interacting with Analytics plugin API
 */

export interface AnalyticsDashboard {
  activeUsers: number
  totalMessages: number
  totalChannels: number
  avgMessagesPerUser: number
  period: string
}

export interface UserAnalytics {
  userId: string
  displayName: string
  email: string
  messageCount: number
  channelCount: number
  lastActive: string
  engagementScore: number
}

export interface ChannelAnalytics {
  channelId: string
  name: string
  memberCount: number
  messageCount: number
  activeMembers: number
  lastActivity: string
}

export interface AnalyticsEvent {
  eventType: string
  userId?: string
  channelId?: string
  metadata?: Record<string, any>
  timestamp?: string
}

export interface AnalyticsEventResponse {
  success: boolean
  tracked: number
  message: string
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  version?: string
  service?: string
  error?: string
}

class AnalyticsService {
  private baseUrl = '/api/plugins/analytics'

  async getDashboard(period: string = '30d'): Promise<AnalyticsDashboard> {
    const response = await fetch(`${this.baseUrl}/dashboard?period=${period}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.statusText}`)
    }

    return response.json()
  }

  async getUserAnalytics(
    period: string = '7d',
    limit: number = 100
  ): Promise<UserAnalytics[]> {
    const response = await fetch(
      `${this.baseUrl}/users?period=${period}&limit=${limit}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch user analytics: ${response.statusText}`)
    }

    const data = await response.json()
    return data.users || []
  }

  async getChannelAnalytics(
    limit: number = 20
  ): Promise<ChannelAnalytics[]> {
    const response = await fetch(`${this.baseUrl}/channels?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch channel analytics: ${response.statusText}`)
    }

    const data = await response.json()
    return data.channels || []
  }

  async trackEvent(event: AnalyticsEvent): Promise<AnalyticsEventResponse> {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      throw new Error(`Failed to track event: ${response.statusText}`)
    }

    return response.json()
  }

  async trackEvents(events: AnalyticsEvent[]): Promise<AnalyticsEventResponse> {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    })

    if (!response.ok) {
      throw new Error(`Failed to track events: ${response.statusText}`)
    }

    return response.json()
  }

  async checkHealth(): Promise<HealthCheck> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.json()
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const analyticsService = new AnalyticsService()
