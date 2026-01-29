import { io, Socket } from 'socket.io-client'
import { SOCKET_CONFIG } from './config'
import type { SocketEvent } from './events'

class SocketManager {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect(token?: string) {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_CONFIG.url, {
      ...SOCKET_CONFIG.options,
      auth: token ? { token } : undefined,
    })

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error)
    })

    return this.socket
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  emit<T>(event: SocketEvent, data: T) {
    this.socket?.emit(event, data)
  }

  on<T>(event: SocketEvent, callback: (data: T) => void) {
    this.socket?.on(event, callback)

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)

    return () => this.off(event, callback)
  }

  off<T>(event: SocketEvent, callback: (data: T) => void) {
    this.socket?.off(event, callback)
    this.listeners.get(event)?.delete(callback)
  }

  get isConnected() {
    return this.socket?.connected ?? false
  }

  get socketId() {
    return this.socket?.id
  }
}

export const socketManager = new SocketManager()
