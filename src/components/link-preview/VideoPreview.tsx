'use client'

/**
 * VideoPreview - Direct video link preview
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { VideoPreviewData } from '@/lib/link-preview'

export interface VideoPreviewProps {
  /** Video preview data */
  data: VideoPreviewData
  /** Auto-play video */
  autoPlay?: boolean
  /** Additional class name */
  className?: string
  /** Children (for action buttons) */
  children?: React.ReactNode
}

export function VideoPreview({
  data,
  autoPlay = false,
  className,
  children,
}: VideoPreviewProps) {
  const handleClick = () => {
    window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  // Check if this is an embeddable video
  const videoUrl = data.url

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
        'hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Video or thumbnail */}
      <div className="relative aspect-video bg-black">
        {videoUrl && !data.image ? (
          <video
            src={videoUrl}
            controls
            autoPlay={autoPlay}
            muted={autoPlay}
            className="w-full h-full object-contain"
            preload="metadata"
          />
        ) : (
          <div
            className="w-full h-full cursor-pointer relative"
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
            {data.image && (
              <img
                src={data.image}
                alt={data.title || 'Video preview'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 ml-1 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with info */}
      {(data.title || data.description) && (
        <div className="p-3 border-t">
          {data.title && (
            <p className="font-semibold text-sm truncate">{data.title}</p>
          )}
          {data.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.description}
            </p>
          )}
          {data.domain && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              {data.favicon && (
                <img src={data.favicon} alt="" className="w-4 h-4" />
              )}
              {data.domain}
            </p>
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

export default VideoPreview
