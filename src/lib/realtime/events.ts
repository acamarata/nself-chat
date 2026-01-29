export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Messages
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_TYPING: 'message:typing',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SUBSCRIBE: 'presence:subscribe',

  // Channels
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  CHANNEL_UPDATE: 'channel:update',

  // Reactions
  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:remove',
} as const

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]

export interface MessagePayload {
  id: string
  channelId: string
  content: string
  authorId: string
  createdAt: string
  updatedAt?: string
}

export interface PresencePayload {
  userId: string
  status: 'online' | 'away' | 'dnd' | 'offline'
  lastSeen?: string
}

export interface TypingPayload {
  channelId: string
  userId: string
  isTyping: boolean
}
