/**
 * API Route: Moderation Actions
 * POST /api/moderation/actions - Take moderation action
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApolloClient } from '@/lib/apollo-client'
import { ModerationQueue } from '@/lib/moderation/moderation-queue'
import { captureError } from '@/lib/sentry-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      itemId,
      action,
      moderatorId,
      reason,
      appealText,
    } = body

    if (!itemId || !action) {
      return NextResponse.json(
        { error: 'Item ID and action are required' },
        { status: 400 }
      )
    }

    const apolloClient = getApolloClient()
    const queue = new ModerationQueue(apolloClient)

    let result

    switch (action) {
      case 'approve':
        if (!moderatorId) {
          return NextResponse.json(
            { error: 'Moderator ID is required' },
            { status: 400 }
          )
        }
        await queue.approveContent(itemId, moderatorId, reason)
        result = { message: 'Content approved' }
        break

      case 'reject':
        if (!moderatorId) {
          return NextResponse.json(
            { error: 'Moderator ID is required' },
            { status: 400 }
          )
        }
        await queue.rejectContent(itemId, moderatorId, reason)
        result = { message: 'Content rejected and deleted' }
        break

      case 'warn':
        if (!moderatorId) {
          return NextResponse.json(
            { error: 'Moderator ID is required' },
            { status: 400 }
          )
        }
        await queue.warnUser(itemId, moderatorId, reason)
        result = { message: 'User warned' }
        break

      case 'appeal':
        if (!appealText) {
          return NextResponse.json(
            { error: 'Appeal text is required' },
            { status: 400 }
          )
        }
        await queue.submitAppeal(itemId, appealText)
        result = { message: 'Appeal submitted' }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Moderation action error:', error)
    captureError(error as Error, {
      tags: { feature: 'moderation', endpoint: 'actions' },
    })

    return NextResponse.json(
      {
        error: 'Failed to perform moderation action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
