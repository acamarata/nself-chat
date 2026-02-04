/**
 * GDPR Privacy Settings Page
 *
 * User-facing interface for GDPR data requests
 * (export and deletion).
 */

'use client'

import { GDPRDataRequest } from '@/components/compliance/GDPRDataRequest'
import { useAuth } from '@/contexts/auth-context'

export default function GDPRPrivacyPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Please log in to access GDPR privacy settings.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <GDPRDataRequest userId={user.id} userEmail={user.email} />
    </div>
  )
}
