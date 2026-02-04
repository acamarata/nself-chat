/**
 * OAuth Callback Complete Page
 *
 * Handles the final step of OAuth authentication by storing the session.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CallbackCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const completeOAuth = async () => {
      try {
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')
        const expiresIn = searchParams.get('expiresIn')

        if (!accessToken || !refreshToken) {
          setStatus('error')
          setMessage('Missing authentication tokens. Please try again.')
          return
        }

        // Store tokens in session storage (in production, use httpOnly cookies)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nchat-access-token', accessToken)
          sessionStorage.setItem('nchat-refresh-token', refreshToken)
          sessionStorage.setItem(
            'nchat-token-expires',
            String(Date.now() + parseInt(expiresIn || '3600') * 1000)
          )
        }

        setStatus('success')
        setMessage('Authentication successful! Redirecting...')

        // Redirect to chat after 1 second
        setTimeout(() => {
          router.push('/chat')
        }, 1000)
      } catch (error) {
        setStatus('error')
        setMessage('Failed to complete authentication. Please try again.')
      }
    }

    completeOAuth()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
              </div>
              <CardTitle>Completing Sign In</CardTitle>
              <CardDescription>Please wait while we complete your authentication...</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle>Success!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle>Authentication Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        {status === 'error' && (
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
