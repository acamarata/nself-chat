/**
 * Incoming Webhook Endpoint
 *
 * Receives webhook events from external services and posts them to channels.
 * Authenticated via URL token parameter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/incoming/[token]
 *
 * Receive webhook from external service
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token) {
      return NextResponse.json(
        { error: 'Missing webhook token' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Get client IP
    const headersList = headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    // TODO: Validate webhook token and find target channel
    // For now, return success
    console.log('Incoming webhook:', {
      token,
      ip,
      body,
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Incoming webhook error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/incoming/[token]
 *
 * Webhook configuration info (for setup/testing)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token) {
      return NextResponse.json(
        { error: 'Missing webhook token' },
        { status: 400 }
      )
    }

    // TODO: Fetch webhook configuration from database

    return NextResponse.json({
      webhook: {
        token,
        url: `${request.nextUrl.origin}/api/webhooks/incoming/${token}`,
        method: 'POST',
        contentType: 'application/json',
      },
      instructions: {
        usage: 'Send POST requests with JSON payload to this endpoint',
        authentication: 'Token is embedded in URL',
        example: {
          url: `${request.nextUrl.origin}/api/webhooks/incoming/${token}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            text: 'Hello from external service!',
            username: 'External Bot',
          },
        },
      },
    })
  } catch (error) {
    console.error('Webhook info error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook info' },
      { status: 500 }
    )
  }
}
