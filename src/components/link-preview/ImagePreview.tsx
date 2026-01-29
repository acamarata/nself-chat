'use client'

/**
 * ImagePreview - Direct image link preview
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { ImagePreviewData } from '@/lib/link-preview'

export interface ImagePreviewProps {
  /** Image preview data */
  data: ImagePreviewData
  /** Maximum image height */
  maxHeight?: number
  /** Additional class name */
  className?: string
  /** Children (for action buttons) */
  children?: React.ReactNode
}

export function ImagePreview({
  data,
  maxHeight = 400,
  className,
  children,
}: ImagePreviewProps) {
  const handleClick = () => {
    window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
        'hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Image */}
      <div
        className="cursor-pointer"
        onClick={handleClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <img
          src={data.image || data.url}
          alt={data.imageAlt || data.title || 'Image preview'}
          className="w-full object-contain"
          style={{ maxHeight: `${maxHeight}px` }}
          loading="lazy"
        />
      </div>

      {/* Footer with info */}
      {(data.title || data.domain) && (
        <div className="p-2 border-t bg-muted/30">
          {data.title && (
            <p className="text-xs font-medium truncate">{data.title}</p>
          )}
          {data.domain && (
            <p className="text-xs text-muted-foreground truncate">{data.domain}</p>
          )}
        </div>
      )}

      {/* Children (remove button, etc.) */}
      {children && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {children}
        </div>
      )}
    </div>
  )
}

export default ImagePreview
