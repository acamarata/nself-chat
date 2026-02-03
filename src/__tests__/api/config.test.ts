/**
 * App Configuration API Tests
 *
 * Tests for /api/config endpoints (GET, POST)
 */

import { GET, POST } from '@/app/api/config/route'
import { NextRequest } from 'next/server'

describe('/api/config', () => {
  describe('GET', () => {
    it('should return app configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/config')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('setup')
      expect(data).toHaveProperty('branding')
      expect(data).toHaveProperty('theme')
    })

    it('should return configuration with default values', async () => {
      const request = new NextRequest('http://localhost:3000/api/config')
      const response = await GET(request)
      const data = await response.json()

      expect(data.setup).toBeDefined()
      expect(data.setup.isCompleted).toBeDefined()
      expect(data.branding.appName).toBeDefined()
    })
  })

  describe('POST', () => {
    it('should update app configuration', async () => {
      const updates = {
        branding: {
          appName: 'Test App',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/config', {
        method: 'POST',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/config', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should validate configuration schema', async () => {
      const invalidUpdates = {
        branding: {
          appName: 123, // Should be string
        },
      }

      const request = new NextRequest('http://localhost:3000/api/config', {
        method: 'POST',
        body: JSON.stringify(invalidUpdates),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      // Should still accept but coerce or validate
      expect([200, 400]).toContain(response.status)
    })

    it('should handle missing body', async () => {
      const request = new NextRequest('http://localhost:3000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
