/**
 * Call Quality Monitoring API
 * POST /api/calls/quality - Report connection quality metrics
 * GET /api/calls/quality - Get quality statistics for debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// SCHEMAS
// ============================================================================

const QualityMetricsSchema = z.object({
  callId: z.string().uuid(),
  participantId: z.string().uuid().optional(),
  timestamp: z.string().datetime().optional(),

  // Network metrics
  connectionType: z.enum(['cellular', 'wifi', 'ethernet', 'unknown']).optional(),
  bandwidth: z
    .object({
      upload: z.number().positive(), // in kbps
      download: z.number().positive(), // in kbps
    })
    .optional(),

  // Audio metrics
  audio: z
    .object({
      bitrate: z.number().positive().optional(),
      packetsLost: z.number().int().min(0).optional(),
      packetsReceived: z.number().int().min(0).optional(),
      jitter: z.number().min(0).optional(), // in ms
      rtt: z.number().min(0).optional(), // round-trip time in ms
      mos: z.number().min(1).max(5).optional(), // Mean Opinion Score
    })
    .optional(),

  // Video metrics
  video: z
    .object({
      bitrate: z.number().positive().optional(),
      frameRate: z.number().positive().optional(),
      resolution: z.string().optional(), // e.g., "1920x1080"
      packetsLost: z.number().int().min(0).optional(),
      packetsReceived: z.number().int().min(0).optional(),
      jitter: z.number().min(0).optional(),
      rtt: z.number().min(0).optional(),
    })
    .optional(),

  // Overall quality score
  qualityScore: z.number().min(0).max(100).optional(),

  // Issues
  issues: z
    .array(
      z.enum([
        'high_packet_loss',
        'high_jitter',
        'high_rtt',
        'low_bandwidth',
        'cpu_overload',
        'network_congestion',
      ])
    )
    .optional(),
})

const QualityQuerySchema = z.object({
  callId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  includeAggregates: z.coerce.boolean().default(true),
})

// ============================================================================
// POST /api/calls/quality - Report quality metrics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/calls/quality - Report quality metrics')

    const body = await request.json()
    const validation = QualityMetricsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid metrics data',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const metrics = validation.data

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify user is participant in the call
    // const isParticipant = await checkCallParticipant(metrics.callId, userId)
    // if (!isParticipant) {
    //   return NextResponse.json(
    //     { success: false, error: 'Not a participant in this call' },
    //     { status: 403 }
    //   )
    // }

    // Calculate quality score if not provided
    let qualityScore = metrics.qualityScore
    if (!qualityScore && (metrics.audio || metrics.video)) {
      qualityScore = calculateQualityScore(metrics)
    }

    // Detect issues
    const issues = detectQualityIssues(metrics)

    const now = new Date().toISOString()

    const qualityReport = {
      id: `quality-${Date.now()}`,
      callId: metrics.callId,
      participantId: metrics.participantId || userId,
      userId,
      timestamp: metrics.timestamp || now,
      connectionType: metrics.connectionType,
      bandwidth: metrics.bandwidth,
      audio: metrics.audio,
      video: metrics.video,
      qualityScore,
      issues,
      reportedAt: now,
    }

    // TODO: Store metrics in time-series database (InfluxDB, TimescaleDB, etc.)
    // await storeQualityMetrics(qualityReport)

    // TODO: Check for alerts/thresholds
    // If quality is critically low, trigger alerts
    if (qualityScore && qualityScore < 30) {
      // await triggerQualityAlert(metrics.callId, userId, qualityScore)
      logger.warn('Critical call quality detected', {
        callId: metrics.callId,
        userId,
        qualityScore,
        issues,
      })
    }

    // TODO: If using LiveKit, also report to LiveKit analytics
    // await reportToLiveKit(qualityReport)

    logger.info('POST /api/calls/quality - Success', {
      callId: metrics.callId,
      qualityScore,
      issueCount: issues.length,
    })

    return NextResponse.json({
      success: true,
      qualityReport: {
        id: qualityReport.id,
        qualityScore,
        issues,
        timestamp: qualityReport.timestamp,
      },
      message: 'Quality metrics reported successfully',
    })
  } catch (error) {
    logger.error('Error reporting quality metrics', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to report quality metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/calls/quality - Get quality statistics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/calls/quality - Get quality statistics')

    const { searchParams } = new URL(request.url)
    const queryParams = {
      callId: searchParams.get('callId') || undefined,
      participantId: searchParams.get('participantId') || undefined,
      since: searchParams.get('since') || undefined,
      limit: searchParams.get('limit') || '100',
      includeAggregates: searchParams.get('includeAggregates') || 'true',
    }

    const validation = QualityQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const params = validation.data

    // TODO: Get user from session
    const userId = request.headers.get('x-user-id') || 'dev-user-id'

    // TODO: Verify user has access to this data
    // if (params.callId) {
    //   const canAccess = await checkCallAccess(userId, params.callId)
    //   if (!canAccess) {
    //     return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    //   }
    // }

    // TODO: Fetch quality metrics from database
    // const metrics = await getQualityMetrics({
    //   callId: params.callId,
    //   participantId: params.participantId,
    //   since: params.since,
    //   limit: params.limit,
    // })

    // Mock quality data
    const metrics = [
      {
        id: 'quality-1',
        callId: params.callId || 'call-123',
        participantId: params.participantId || 'participant-1',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        qualityScore: 85,
        audio: {
          bitrate: 64,
          packetsLost: 5,
          packetsReceived: 1000,
          jitter: 15,
          rtt: 45,
          mos: 4.2,
        },
        video: {
          bitrate: 1500,
          frameRate: 30,
          resolution: '1280x720',
          packetsLost: 10,
          packetsReceived: 5000,
          jitter: 20,
          rtt: 45,
        },
        issues: [],
      },
      {
        id: 'quality-2',
        callId: params.callId || 'call-123',
        participantId: params.participantId || 'participant-1',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        qualityScore: 72,
        audio: {
          bitrate: 64,
          packetsLost: 15,
          packetsReceived: 1000,
          jitter: 35,
          rtt: 120,
          mos: 3.8,
        },
        video: {
          bitrate: 1200,
          frameRate: 25,
          resolution: '1280x720',
          packetsLost: 30,
          packetsReceived: 4500,
          jitter: 45,
          rtt: 120,
        },
        issues: ['high_jitter', 'high_rtt'],
      },
    ]

    const response: any = {
      success: true,
      metrics,
      count: metrics.length,
    }

    // Calculate aggregates if requested
    if (params.includeAggregates && metrics.length > 0) {
      response.aggregates = {
        averageQualityScore: metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length,
        averageAudioMos: metrics.reduce((sum, m) => sum + (m.audio?.mos || 0), 0) / metrics.length,
        totalIssues: metrics.reduce((sum, m) => sum + m.issues.length, 0),
        commonIssues: getCommonIssues(metrics),
        qualityTrend: calculateTrend(metrics),
      }
    }

    logger.info('GET /api/calls/quality - Success', {
      callId: params.callId,
      metricsCount: metrics.length,
    })

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Error fetching quality statistics', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quality statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate overall quality score from metrics
 */
function calculateQualityScore(metrics: z.infer<typeof QualityMetricsSchema>): number {
  let score = 100

  // Audio quality (40% weight)
  if (metrics.audio) {
    const audioScore = calculateAudioScore(metrics.audio)
    score -= (100 - audioScore) * 0.4
  }

  // Video quality (40% weight)
  if (metrics.video) {
    const videoScore = calculateVideoScore(metrics.video)
    score -= (100 - videoScore) * 0.4
  }

  // Bandwidth (20% weight)
  if (metrics.bandwidth) {
    const bandwidthScore = calculateBandwidthScore(metrics.bandwidth)
    score -= (100 - bandwidthScore) * 0.2
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function calculateAudioScore(audio: any): number {
  let score = 100

  // Packet loss impact
  if (audio.packetsLost && audio.packetsReceived) {
    const lossRate = audio.packetsLost / (audio.packetsReceived + audio.packetsLost)
    score -= lossRate * 50 // Up to -50 for 100% loss
  }

  // Jitter impact
  if (audio.jitter) {
    if (audio.jitter > 100) score -= 30
    else if (audio.jitter > 50) score -= 15
    else if (audio.jitter > 30) score -= 5
  }

  // RTT impact
  if (audio.rtt) {
    if (audio.rtt > 300) score -= 30
    else if (audio.rtt > 150) score -= 15
    else if (audio.rtt > 100) score -= 5
  }

  return Math.max(0, score)
}

function calculateVideoScore(video: any): number {
  let score = 100

  // Packet loss impact
  if (video.packetsLost && video.packetsReceived) {
    const lossRate = video.packetsLost / (video.packetsReceived + video.packetsLost)
    score -= lossRate * 40
  }

  // Frame rate impact
  if (video.frameRate) {
    if (video.frameRate < 15) score -= 30
    else if (video.frameRate < 24) score -= 15
  }

  // Jitter impact
  if (video.jitter) {
    if (video.jitter > 100) score -= 20
    else if (video.jitter > 50) score -= 10
  }

  return Math.max(0, score)
}

function calculateBandwidthScore(bandwidth: any): number {
  let score = 100

  // Upload bandwidth (important for video)
  if (bandwidth.upload < 500) score -= 40
  else if (bandwidth.upload < 1000) score -= 20

  // Download bandwidth
  if (bandwidth.download < 500) score -= 40
  else if (bandwidth.download < 1000) score -= 20

  return Math.max(0, score)
}

/**
 * Detect quality issues from metrics
 */
function detectQualityIssues(
  metrics: z.infer<typeof QualityMetricsSchema>
): Array<
  | 'high_packet_loss'
  | 'high_jitter'
  | 'high_rtt'
  | 'low_bandwidth'
  | 'cpu_overload'
  | 'network_congestion'
> {
  const issues: any[] = []

  // Check audio metrics
  if (metrics.audio) {
    const { packetsLost, packetsReceived, jitter, rtt } = metrics.audio
    if (packetsLost && packetsReceived) {
      const lossRate = packetsLost / (packetsReceived + packetsLost)
      if (lossRate > 0.05) issues.push('high_packet_loss')
    }
    if (jitter && jitter > 50) issues.push('high_jitter')
    if (rtt && rtt > 150) issues.push('high_rtt')
  }

  // Check video metrics
  if (metrics.video) {
    const { packetsLost, packetsReceived, jitter, rtt } = metrics.video
    if (packetsLost && packetsReceived) {
      const lossRate = packetsLost / (packetsReceived + packetsLost)
      if (lossRate > 0.03) issues.push('high_packet_loss')
    }
    if (jitter && jitter > 50) issues.push('high_jitter')
    if (rtt && rtt > 150) issues.push('high_rtt')
  }

  // Check bandwidth
  if (metrics.bandwidth) {
    if (metrics.bandwidth.upload < 500 || metrics.bandwidth.download < 500) {
      issues.push('low_bandwidth')
    }
  }

  // Deduplicate issues
  return [...new Set(issues)]
}

/**
 * Get most common issues from metrics array
 */
function getCommonIssues(metrics: any[]): Record<string, number> {
  const issueCounts: Record<string, number> = {}

  metrics.forEach((m) => {
    m.issues.forEach((issue: string) => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1
    })
  })

  return issueCounts
}

/**
 * Calculate quality trend (improving, stable, degrading)
 */
function calculateTrend(metrics: any[]): 'improving' | 'stable' | 'degrading' {
  if (metrics.length < 2) return 'stable'

  const scores = metrics.map((m) => m.qualityScore)
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
  const secondHalf = scores.slice(Math.floor(scores.length / 2))

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  const diff = secondAvg - firstAvg

  if (diff > 5) return 'improving'
  if (diff < -5) return 'degrading'
  return 'stable'
}
