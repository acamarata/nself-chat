/**
 * Thread Reply API Route
 *
 * POST /api/threads/[id]/reply - Reply to a thread
 *
 * Features:
 * - Create reply in thread
 * - Automatically track participants
 * - Send notifications to thread participants
 * - Update thread metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { getThreadService } from '@/services/messages/thread.service'
import { apolloClient } from '@/lib/apollo-client'
import { getMentionService } from '@/services/messages/mention.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const ThreadReplySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(4000, 'Message content too long (max 4000 characters)'),
  mentions: z.array(z.string().uuid()).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        size: z.number(),
        mimetype: z.string(),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================================================
// SERVICES
// ============================================================================

const threadService = getThreadService(apolloClient)
const mentionService = getMentionService(apolloClient)

// ============================================================================
// POST - Reply to thread
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const threadId = resolvedParams.id

  try {
    logger.info('POST /api/threads/[id]/reply', { threadId })

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(threadId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid thread ID format' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = ThreadReplySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const data = validation.data

    // Parse mentions from content
    const parsedMentions = mentionService.parseMentions(data.content)
    const mentionedUserIds = data.mentions || []

    // Reply to thread via service
    const result = await threadService.replyToThread({
      threadId,
      userId: data.userId,
      content: data.content,
      mentions: mentionedUserIds,
      metadata: data.metadata,
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error?.message || 'Failed to create thread reply' },
        { status: result.error?.status || 500 }
      )
    }

    const reply = result.data

    // Send mention notifications (async, don't wait)
    if (mentionedUserIds.length > 0 || mentionService.hasMentions(data.content)) {
      mentionService
        .notifyMentionedUsers(data.content, {
          messageId: reply.id,
          channelId: reply.channelId,
          actorId: data.userId,
          actorName: reply.user.displayName,
          messagePreview: data.content.substring(0, 100),
          threadId,
        })
        .catch((err) => {
          logger.warn('Failed to send mention notifications in thread', { error: err })
        })
    }

    // Get thread participants to notify
    const threadResult = await threadService.getThread(threadId)
    if (threadResult.success && threadResult.data) {
      const participantIds = threadResult.data.participants
        .map((p) => p.id)
        .filter((id) => id !== data.userId) // Don't notify the author

      // Send thread reply notifications (async)
      if (participantIds.length > 0) {
        // TODO: Implement notification service call
        logger.debug('Would notify thread participants', {
          threadId,
          participantIds,
          replyId: reply.id,
        })
      }
    }

    logger.info('Thread reply created successfully', {
      threadId,
      replyId: reply.id,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          reply,
          threadId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/threads/[id]/reply - Error', error as Error, {
      threadId,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create thread reply',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
