/**
 * Channel Categories API
 * GET /api/channels/categories - List categories
 * POST /api/channels/categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { CreateCategoryInput, ChannelCategory } from '@/types/advanced-channels'

const DEFAULT_WORKSPACE_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_ID
    const includeChannels = searchParams.get('includeChannels') === 'true'

    // TODO: Fetch from database via GraphQL
    const categories: ChannelCategory[] = []

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input: CreateCategoryInput = await request.json()

    // Validate input
    if (!input.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // TODO: Create category via GraphQL mutation
    const category = {
      id: crypto.randomUUID(),
      ...input,
      workspaceId: input.workspaceId || DEFAULT_WORKSPACE_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
