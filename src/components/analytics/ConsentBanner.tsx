/**
 * Analytics Consent Banner
 *
 * GDPR-compliant consent banner shown on first app launch
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, X, Settings } from 'lucide-react'
import { analyticsPrivacy, hasProvidedConsent } from '@/lib/analytics/privacy'
import { analytics } from '@/lib/analytics'

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Show banner if user hasn't provided consent
    const hasConsent = hasProvidedConsent()
    setIsVisible(!hasConsent)
  }, [])

  const handleAcceptAll = async () => {
    try {
      setSaving(true)
      await analyticsPrivacy.acceptAll()

      // Track consent acceptance
      if (analytics.isEnabled()) {
        await analytics.trackScreenView('consent_accepted')
      }

      setIsVisible(false)
    } catch (error) {
      console.error('Failed to accept analytics:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRejectAll = async () => {
    try {
      setSaving(true)
      await analyticsPrivacy.rejectAll()
      setIsVisible(false)
    } catch (error) {
      console.error('Failed to reject analytics:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCustomize = () => {
    // Navigate to settings
    window.location.href = '/settings/privacy'
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl p-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Your Privacy Matters</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-2 -mr-2"
                onClick={handleRejectAll}
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              We use analytics to improve your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>We collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Usage patterns (features you use, screens you visit)</li>
                <li>Performance data (app speed, load times)</li>
                <li>Error reports (to fix bugs)</li>
                <li>Device info (platform, OS version)</li>
              </ul>

              <p className="mt-3 font-medium">We do NOT collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your messages or conversations</li>
                <li>Files or attachments</li>
                <li>Passwords or tokens</li>
              </ul>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You can change these settings at any time in Privacy Settings.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleAcceptAll}
                disabled={saving}
                className="flex-1"
              >
                Accept All
              </Button>
              <Button
                onClick={handleRejectAll}
                variant="outline"
                disabled={saving}
                className="flex-1"
              >
                Reject All
              </Button>
              <Button
                onClick={handleCustomize}
                variant="ghost"
                disabled={saving}
                className="flex-1 gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By using nChat, you agree to our{' '}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
