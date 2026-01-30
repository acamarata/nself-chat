'use client'

/**
 * Bot Message Component
 * Renders rich bot messages with blocks, buttons, and interactive elements
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type {
  Block,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  ActionsBlock,
  ContextBlock,
  RichMessage,
} from '@/lib/bot-sdk/types'

// ============================================================================
// TYPES
// ============================================================================

export interface BotMessageProps {
  message: RichMessage
  botName?: string
  botAvatar?: string
  timestamp?: Date
  onButtonClick?: (actionId: string, value?: string) => void
  className?: string
}

export interface BlockRendererProps {
  block: Block
  onButtonClick?: (actionId: string, value?: string) => void
}

// ============================================================================
// STYLES
// ============================================================================

const messageContainerVariants = cva(
  'flex gap-3 p-4 rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-muted/50',
        highlighted: 'bg-primary/10 border border-primary/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const buttonStyleVariants = cva(
  'px-3 py-1.5 text-sm font-medium rounded transition-colors',
  {
    variants: {
      style: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
    },
    defaultVariants: {
      style: 'default',
    },
  }
)

// ============================================================================
// BLOCK RENDERERS
// ============================================================================

/**
 * Render a text block
 */
export function TextBlockRenderer({ block }: { block: TextBlock }) {
  if (block.markdown) {
    // Simple markdown-like rendering
    const formattedText = formatMarkdown(block.text)
    return (
      <div
        className="text-sm text-foreground whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    )
  }

  return (
    <p className="text-sm text-foreground whitespace-pre-wrap">{block.text}</p>
  )
}

/**
 * Render an image block
 */
export function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  return (
    <figure className="my-2">
      <img
        src={block.url}
        alt={block.alt ?? ''}
        title={block.title}
        className="max-w-full h-auto rounded-md"
        loading="lazy"
      />
      {block.title && (
        <figcaption className="mt-1 text-xs text-muted-foreground">
          {block.title}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Render a button block
 */
export function ButtonBlockRenderer({
  block,
  onClick,
}: {
  block: ButtonBlock
  onClick?: (actionId: string, value?: string) => void
}) {
  const handleClick = () => {
    if (block.url) {
      window.open(block.url, '_blank', 'noopener,noreferrer')
    } else {
      onClick?.(block.actionId, block.value)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={block.disabled}
      className={cn(
        buttonStyleVariants({ style: block.style ?? 'default' }),
        block.disabled && 'opacity-50 cursor-not-allowed'
      )}
      data-action-id={block.actionId}
      data-testid={`bot-button-${block.actionId}`}
    >
      {block.text}
    </button>
  )
}

/**
 * Render a divider block
 */
export function DividerBlockRenderer() {
  return <hr className="my-3 border-t border-border" />
}

/**
 * Render an actions block (group of buttons)
 */
export function ActionsBlockRenderer({
  block,
  onClick,
}: {
  block: ActionsBlock
  onClick?: (actionId: string, value?: string) => void
}) {
  return (
    <div
      className="flex flex-wrap gap-2 my-2"
      data-block-id={block.blockId}
      data-testid="bot-actions-block"
    >
      {block.elements.map((button, index) => (
        <ButtonBlockRenderer
          key={`${button.actionId}-${index}`}
          block={button}
          onClick={onClick}
        />
      ))}
    </div>
  )
}

/**
 * Render a context block
 */
export function ContextBlockRenderer({ block }: { block: ContextBlock }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
      {block.elements.map((element, index) => {
        if (element.type === 'text') {
          const textEl = element as TextBlock
          return (
            <span key={index} className={textEl.markdown ? 'font-medium' : ''}>
              {textEl.text}
            </span>
          )
        }
        if (element.type === 'image') {
          const imgEl = element as ImageBlock
          return (
            <img
              key={index}
              src={imgEl.url}
              alt={imgEl.alt ?? ''}
              className="w-4 h-4 rounded-full object-cover"
            />
          )
        }
        return null
      })}
    </div>
  )
}

/**
 * Generic block renderer
 */
export function BlockRenderer({ block, onButtonClick }: BlockRendererProps) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />
    case 'image':
      return <ImageBlockRenderer block={block} />
    case 'button':
      return <ButtonBlockRenderer block={block} onClick={onButtonClick} />
    case 'divider':
      return <DividerBlockRenderer />
    case 'actions':
      return <ActionsBlockRenderer block={block} onClick={onButtonClick} />
    case 'context':
      return <ContextBlockRenderer block={block} />
    default:
      return null
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Bot message component
 */
export function BotMessage({
  message,
  botName = 'Bot',
  botAvatar,
  timestamp,
  onButtonClick,
  className,
}: BotMessageProps) {
  return (
    <div
      className={cn(messageContainerVariants(), className)}
      data-testid="bot-message"
    >
      {/* Bot avatar */}
      <div className="flex-shrink-0">
        {botAvatar ? (
          <img
            src={botAvatar}
            alt={botName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {botName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Bot name and timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{botName}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
            BOT
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTime(timestamp)}
            </span>
          )}
        </div>

        {/* Plain text content */}
        {message.text && (
          <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
            {message.text}
          </p>
        )}

        {/* Blocks */}
        {message.blocks?.map((block, index) => (
          <BlockRenderer
            key={`block-${index}`}
            block={block}
            onButtonClick={onButtonClick}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Bot message skeleton for loading states
 */
export function BotMessageSkeleton() {
  return (
    <div
      className={cn(messageContainerVariants(), 'animate-pulse')}
      data-testid="bot-message-skeleton"
    >
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    </div>
  )
}

/**
 * Typing indicator for bot
 */
export function BotTypingIndicator({ botName = 'Bot' }: { botName?: string }) {
  return (
    <div
      className={cn(messageContainerVariants())}
      data-testid="bot-typing-indicator"
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <span className="text-sm font-semibold text-primary">
          {botName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-full">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple markdown formatting
 */
function formatMarkdown(text: string): string {
  let formatted = text

  // Bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough: ~~text~~
  formatted = formatted.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Inline code: `code`
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="px-1 py-0.5 bg-muted rounded text-sm font-mono">$1</code>'
  )

  // Links: [text](url)
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
  )

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br />')

  return formatted
}

/**
 * Format timestamp
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  messageContainerVariants,
  buttonStyleVariants,
  formatMarkdown,
  formatTime,
}
