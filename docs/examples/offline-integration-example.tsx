/**
 * Phase 17 Offline Integration Example
 *
 * Complete example showing how to integrate offline support
 * into a chat application component.
 *
 * @version 0.9.0
 */

'use client'

import { useState, useEffect } from 'react'
import { useOptimisticMessages } from '@/hooks/use-optimistic-messages'
import { useSettingsSync } from '@/hooks/use-settings-sync'
import { useOfflineStatus } from '@/hooks/use-offline-status'
import { OfflineIndicator } from '@/components/ui/offline-indicator'
import { OfflineQueueViewer } from '@/components/offline/offline-queue-viewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Upload, Settings, List } from 'lucide-react'

// =============================================================================
// Complete Chat Component with Offline Support
// =============================================================================

export function ChatWithOfflineSupport({ channelId }: { channelId: string }) {
  // ===== State Management =====
  const [messageInput, setMessageInput] = useState('')
  const [showQueueViewer, setShowQueueViewer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // ===== Offline Hooks =====
  const {
    sendMessage,
    optimisticMessages,
    pendingCount,
    failedCount,
    retryMessage,
  } = useOptimisticMessages(channelId)

  const {
    isOnline,
    queueCount,
    sync,
    flushQueue,
  } = useOfflineStatus()

  const {
    settings,
    updateSettings,
    hasUnsyncedChanges,
    conflict,
    resolveConflict,
  } = useSettingsSync()

  // ===== Message Handlers =====
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    try {
      // Message appears instantly in UI
      await sendMessage({
        channelId,
        content: messageInput,
        contentType: 'text',
      })

      // Clear input
      setMessageInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
      // Error handling is done by the hook
    }
  }

  const handleSendWithAttachment = async (file: File) => {
    try {
      await sendMessage({
        channelId,
        content: 'Sent a file',
        attachments: [file],
      })
    } catch (error) {
      console.error('Failed to send attachment:', error)
    }
  }

  // ===== Settings Handlers =====
  const handleThemeChange = async (theme: string) => {
    await updateSettings({
      theme: { preset: theme },
    })
  }

  const handleConflictResolution = async (choice: 'local' | 'server') => {
    if (conflict) {
      await resolveConflict(choice)
    }
  }

  // ===== Sync Handlers =====
  const handleSync = async () => {
    try {
      await sync()
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const handleFlushQueue = async () => {
    try {
      await flushQueue()
    } catch (error) {
      console.error('Failed to flush queue:', error)
    }
  }

  // ===== Render =====
  return (
    <div className="flex h-screen flex-col">
      {/* Offline Indicator */}
      <OfflineIndicator position="top" detailed />

      {/* Header */}
      <div className="border-b bg-white p-4 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Channel Chat</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Badge variant={isOnline ? 'success' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>

              {queueCount > 0 && (
                <Badge variant="secondary">
                  {queueCount} queued
                </Badge>
              )}

              {pendingCount > 0 && (
                <Badge variant="default">
                  {pendingCount} sending
                </Badge>
              )}

              {failedCount > 0 && (
                <Badge variant="destructive">
                  {failedCount} failed
                </Badge>
              )}

              {hasUnsyncedChanges && (
                <Badge variant="warning">
                  Settings not synced
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {/* Queue Viewer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQueueViewer(true)}
            >
              <List className="mr-2 h-4 w-4" />
              Queue
            </Button>

            {/* Settings */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            {/* Sync Button */}
            {(queueCount > 0 || hasUnsyncedChanges) && isOnline && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSync}
              >
                Sync Now
              </Button>
            )}
          </div>
        </div>

        {/* Conflict Alert */}
        {conflict && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Settings Conflict Detected
            </p>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Your settings were changed on another device. Which version do you want to keep?
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConflictResolution('local')}
              >
                Keep This Device
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConflictResolution('server')}
              >
                Use Other Device
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Regular messages would go here */}

          {/* Optimistic messages */}
          {optimisticMessages.map((msg) => (
            <OptimisticMessageCard
              key={msg.tempId}
              message={msg}
              onRetry={retryMessage}
            />
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4 dark:bg-gray-900">
        <div className="flex gap-2">
          {/* File Upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleSendWithAttachment(file)
              }}
            />
            <Button variant="outline" size="icon" asChild>
              <span>
                <Upload className="h-4 w-4" />
              </span>
            </Button>
          </label>

          {/* Text Input */}
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={
              isOnline
                ? 'Type a message...'
                : 'Offline - Messages will be sent when you reconnect'
            }
            disabled={false} // Can send even when offline
          />

          {/* Send Button */}
          <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
            Send
          </Button>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You're offline. Messages will be sent automatically when you reconnect.
          </p>
        )}
      </div>

      {/* Queue Viewer Dialog */}
      <OfflineQueueViewer
        asDialog
        open={showQueueViewer}
        onClose={() => setShowQueueViewer(false)}
      />

      {/* Settings Dialog */}
      {showSettings && (
        <SettingsDialog
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

// =============================================================================
// Optimistic Message Card Component
// =============================================================================

interface OptimisticMessageCardProps {
  message: any
  onRetry: (tempId: string) => void
}

function OptimisticMessageCard({ message, onRetry }: OptimisticMessageCardProps) {
  return (
    <Card className={`p-4 ${message.status === 'failed' ? 'border-red-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{message.user.displayName}</span>
            <Badge
              variant={
                message.status === 'sent'
                  ? 'success'
                  : message.status === 'failed'
                  ? 'destructive'
                  : 'default'
              }
            >
              {message.status}
            </Badge>
          </div>

          <p className="mt-2 text-gray-900 dark:text-gray-100">
            {message.content}
          </p>

          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment: any, i: number) => (
                <div key={i} className="text-sm text-gray-600">
                  📎 {attachment.name}
                </div>
              ))}
            </div>
          )}

          {message.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Error: {message.error}
            </p>
          )}
        </div>

        {message.status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry(message.tempId)}
          >
            Retry
          </Button>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// Settings Dialog Component
// =============================================================================

interface SettingsDialogProps {
  settings: any
  onUpdate: (updates: any) => Promise<void>
  onClose: () => void
}

function SettingsDialog({ settings, onUpdate, onClose }: SettingsDialogProps) {
  const [theme, setTheme] = useState(settings?.theme?.preset || 'light')

  const handleSave = async () => {
    await onUpdate({
      theme: { preset: theme },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-bold">Settings</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-1 w-full rounded border p-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="nself">nself</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  )
}

// =============================================================================
// Usage Example
// =============================================================================

/*
import { ChatWithOfflineSupport } from '@/docs/examples/offline-integration-example'

export default function ChannelPage({ params }: { params: { id: string } }) {
  return <ChatWithOfflineSupport channelId={params.id} />
}
*/

export default ChatWithOfflineSupport
