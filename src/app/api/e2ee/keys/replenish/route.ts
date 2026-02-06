/**
 * API Route: /api/e2ee/keys/replenish
 * Replenish one-time prekeys
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger.server'

// Force dynamic rendering - E2EE uses native modules that can't be built statically
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { count = 50 } = await request.json()

    // Dynamic import to avoid loading native modules during build
    const [{ getApolloClient }, { getE2EEManager }] = await Promise.all([
      import('@/lib/apollo-client'),
      import('@/lib/e2ee'),
    ])

    const apolloClient = getApolloClient()
    const e2eeManager = getE2EEManager(apolloClient)

    if (!e2eeManager.isInitialized()) {
      return NextResponse.json({ error: 'E2EE not initialized' }, { status: 400 })
    }

    // Replenish one-time prekeys
    await e2eeManager.replenishOneTimePreKeys(count)

    return NextResponse.json({
      success: true,
      message: `Successfully replenished ${count} one-time prekeys`,
      count,
    })
  } catch (error: any) {
    logger.error('Prekey replenishment error:', error)

    return NextResponse.json(
      {
        error: 'Failed to replenish prekeys',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
