'use client'

/**
 * CodePreview - Code snippet/gist preview (GitHub Gist, CodePen, CodeSandbox)
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { CodePreviewData } from '@/lib/link-preview'

export interface CodePreviewProps {
  /** Code preview data */
  data: CodePreviewData
  /** Show embed iframe */
  showEmbed?: boolean
  /** Additional class name */
  className?: string
  /** Children (for action buttons) */
  children?: React.ReactNode
}

export function CodePreview({
  data,
  showEmbed = false,
  className,
  children,
}: CodePreviewProps) {
  const handleClick = () => {
    window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
        'hover:border-primary/50 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-muted/50">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <span className="text-sm font-medium">{data.siteName || 'Code'}</span>
      </div>

      {/* Content */}
      <div
        className="p-3 cursor-pointer"
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
        <div className="flex gap-3">
          {data.image && (
            <img
              src={data.image}
              alt={data.title || 'Code preview'}
              className="w-24 h-16 rounded object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            {data.title && (
              <p className="font-semibold text-sm truncate">{data.title}</p>
            )}
            {data.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Children (remove button, etc.) */}
      {children && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {children}
        </div>
      )}
    </div>
  )
}

export default CodePreview
