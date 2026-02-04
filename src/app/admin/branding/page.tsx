/**
 * Admin Branding Management Page
 *
 * Complete white-label branding dashboard for administrators
 */

import { Metadata } from 'next'
import { BrandingDashboard } from '@/components/white-label/branding-dashboard'

export const metadata: Metadata = {
  title: 'White Label Branding | Admin',
  description: 'Manage white-label branding and customization',
}

export default function BrandingPage() {
  // TODO: Get actual tenant ID and user ID from auth
  const tenantId = 'default'
  const userId = 'admin'

  return (
    <div className="container mx-auto p-6">
      <BrandingDashboard tenantId={tenantId} userId={userId} />
    </div>
  )
}
