/**
 * Logo Upload API Route
 *
 * POST /api/tenants/[id]/branding/upload - Upload logo file
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST - Upload logo file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params

    const formData = await request.formData()

    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // TODO: Validate file type and size
    // TODO: Upload to storage (MinIO/S3)
    // TODO: Generate thumbnails if needed
    // TODO: Save to database

    const storageKey = `tenants/${tenantId}/logos/${type}-${Date.now()}-${file.name}`
    const url = `/uploads/${storageKey}` // Mock URL

    logger.info('Logo uploaded:', {
      tenantId,
      type,
      filename: file.name,
      size: file.size,
      storageKey,
    })

    return NextResponse.json({
      url,
      storageKey,
    })
  } catch (error) {
    logger.error('POST /api/tenants/[id]/branding/upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
