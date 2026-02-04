/**
 * Realtime Integration Example
 *
 * Complete example showing how to use all Phase 7 realtime features:
 * - Connection management
 * - Presence tracking
 * - Typing indicators
 * - Delivery receipts
 * - Offline queue
 *
 * @module docs/examples/realtime-integration-example
 * @version 0.9.0
 */

'use client'

import { useEffect, useState } from 'react'
import { useRealtimeIntegration } from '@/hooks/use-realtime-integration'
import { ConnectionStatus } from '@/components/realtime/connection-status'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, CheckCheck } from 'lucide-react'

// ============================================================================
// Example: Complete Chat Component
// ============================================================================

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

interface ChatComponentProps {
  channelId: string
  currentUserId: string
  channelMembers: Array<{ id: string; name: string; avatar?: string }>
}

export function RealtimeChatExample({
  channelId,
  currentUserId,
  channelMembers,
}: ChatComponentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')

  // Get all realtime services
  const { isConnected, presence, typing, delivery, queue } = useRealtimeIntegration()

  // ============================================================================
  // 1. PRESENCE MANAGEMENT
  // ============================================================================

  // Set presence to online when component mounts
  useEffect(() => {
    if (presence) {
      presence.setStatus('online')

      // Set custom status
      presence.setCustomStatus({
        text: 'Chatting',
        emoji: '💬',
        expiresAt: null, // No expiration
      })
    }

    return () => {
      // Set away when unmounting
      if (presence) {
        presence.setStatus('away')
      }
    }
  }, [presence])

  // Subscribe to presence updates for channel members
  useEffect(() => {
    if (presence) {
      const memberIds = channelMembers.map((m) => m.id)
      presence.subscribeToUsers(memberIds)

      return () => {
        presence.unsubscribeFromUsers(memberIds)
      }
    }
  }, [presence, channelMembers])

  // Get presence for a user
  const getUserPresence = (userId: string) => {
    if (!presence) return null
    return presence.getPresence(userId)
  }

  // ============================================================================
  // 2. TYPING INDICATORS
  // ============================================================================

  // Handle input changes with typing indicators
  const handleInputChange = (value: string) => {
    setInputValue(value)

    // Typing service automatically handles debouncing and throttling
    if (typing) {
      typing.handleInputChange(channelId, value)
    }
  }

  // Get typing users
  const typingUsers = typing?.getTypingUsers(channelId) || []
  const typingText = typing?.getTypingText(channelId)

  // ============================================================================
  // 3. MESSAGE SENDING WITH DELIVERY TRACKING
  // ============================================================================

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const tempMessage: Message = {
      id: clientMessageId,
      content: inputValue,
      senderId: currentUserId,
      createdAt: new Date(),
      status: 'sending',
    }

    // Add optimistic message
    setMessages((prev) => [...prev, tempMessage])

    // Clear input and stop typing
    setInputValue('')
    if (typing) {
      typing.stopTyping(channelId)
    }

    // Track delivery status
    if (delivery) {
      delivery.trackOutgoing(clientMessageId, channelId, channelMembers.length - 1)
    }

    try {
      if (isConnected) {
        // Send via WebSocket (in real app, this would call your API)
        // await sendMessageToServer(...)

        // Update message status to sent
        setMessages((prev) =>
          prev.map((msg) => (msg.id === clientMessageId ? { ...msg, status: 'sent' as const } : msg))
        )
      } else {
        // Queue message if offline
        if (queue) {
          queue.queueMessage({
            channelId,
            content: inputValue,
            type: 'text',
          })

          // Update status to indicate queued
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === clientMessageId ? { ...msg, status: 'sending' as const } : msg
            )
          )
        }
      }
    } catch (error) {
      // Update message status to failed
      setMessages((prev) =>
        prev.map((msg) => (msg.id === clientMessageId ? { ...msg, status: 'failed' as const } : msg))
      )
    }
  }

  // ============================================================================
  // 4. READ RECEIPTS
  // ============================================================================

  // Mark messages as read when they become visible
  useEffect(() => {
    if (delivery && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]

      // Only acknowledge messages from others
      if (latestMessage.senderId !== currentUserId) {
        delivery.acknowledgeRead(latestMessage.id, channelId)
      }
    }
  }, [delivery, messages, currentUserId, channelId])

  // ============================================================================
  // 5. OFFLINE QUEUE STATUS
  // ============================================================================

  const queuedCount = queue?.getQueueLength() || 0

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-screen">
      {/* Header with connection status */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Chat Example</h1>
          <ConnectionStatus variant="header" showDetails />
        </div>

        {/* Offline queue indicator */}
        {queuedCount > 0 && (
          <div className="mt-2">
            <Badge variant="secondary">{queuedCount} messages queued</Badge>
          </div>
        )}
      </div>

      {/* Channel members with presence */}
      <div className="border-b p-4">
        <div className="flex gap-2 overflow-x-auto">
          {channelMembers.map((member) => {
            const memberPresence = getUserPresence(member.id)
            const isOnline = memberPresence?.status === 'online'

            return (
              <div key={member.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>

                  {/* Presence indicator */}
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <span className="text-xs">{member.name}</span>
                {memberPresence?.customStatus && (
                  <span className="text-xs">
                    {memberPresence.customStatus.emoji} {memberPresence.customStatus.text}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isSent = message.senderId === currentUserId

          return (
            <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isSent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p>{message.content}</p>

                {/* Delivery status for sent messages */}
                {isSent && (
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                    {message.status === 'sending' && <span>Sending...</span>}
                    {message.status === 'sent' && (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Sent</span>
                      </>
                    )}
                    {message.status === 'delivered' && (
                      <>
                        <CheckCheck className="h-3 w-3" />
                        <span>Delivered</span>
                      </>
                    )}
                    {message.status === 'read' && (
                      <>
                        <CheckCheck className="h-3 w-3 text-blue-300" />
                        <span>Read</span>
                      </>
                    )}
                    {message.status === 'failed' && (
                      <span className="text-red-300">Failed to send</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600 italic">{typingText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
            rows={3}
          />
          <Button onClick={sendMessage} disabled={!inputValue.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Example: Presence Status Selector
// ============================================================================

export function PresenceStatusExample() {
  const { presence } = useRealtimeIntegration()

  if (!presence) return null

  const currentStatus = presence.getStatus()
  const currentCustomStatus = presence.getCustomStatus()

  const statuses = [
    { value: 'online' as const, label: 'Online', color: 'bg-green-500' },
    { value: 'away' as const, label: 'Away', color: 'bg-yellow-500' },
    { value: 'busy' as const, label: 'Busy', color: 'bg-red-500' },
    { value: 'offline' as const, label: 'Invisible', color: 'bg-gray-500' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Status</h3>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => (
            <Button
              key={status.value}
              variant={currentStatus === status.value ? 'default' : 'outline'}
              onClick={() => presence.setStatus(status.value)}
              className="justify-start"
            >
              <div className={`w-3 h-3 rounded-full ${status.color} mr-2`} />
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Custom Status</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Status text..."
            className="w-full p-2 border rounded"
            defaultValue={currentCustomStatus?.text || ''}
            onChange={(e) => {
              presence.setCustomStatus({
                text: e.target.value,
                emoji: currentCustomStatus?.emoji || '💬',
                expiresAt: currentCustomStatus?.expiresAt || null,
              })
            }}
          />
          <Button
            variant="outline"
            onClick={() => presence.setCustomStatus(null)}
          >
            Clear Custom Status
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Example: Connection Quality Indicator
// ============================================================================

export function ConnectionQualityExample() {
  const { status } = useRealtimeIntegration()

  const getQualityColor = (quality: typeof status.connectionQuality) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-500'
      case 'good':
        return 'bg-blue-500'
      case 'fair':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 h-${bar * 2} ${
              bar <= (['excellent', 'good', 'fair', 'poor'].indexOf(status.connectionQuality) + 1)
                ? getQualityColor(status.connectionQuality)
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm capitalize">{status.connectionQuality}</span>
    </div>
  )
}

// ============================================================================
// Example: App Initialization
// ============================================================================

export function RealtimeAppInitExample({ userId, token }: { userId: string; token: string }) {
  useEffect(() => {
    // Initialize realtime integration on app start
    const { initializeRealtimeIntegration } = require('@/services/realtime/realtime-integration.service')

    initializeRealtimeIntegration({
      userId,
      token,
      enablePresence: true,
      enableTyping: true,
      enableDeliveryReceipts: true,
      enableOfflineQueue: true,
      debug: process.env.NODE_ENV === 'development',
      autoConnect: true,
    })
  }, [userId, token])

  return null
}

export default RealtimeChatExample
