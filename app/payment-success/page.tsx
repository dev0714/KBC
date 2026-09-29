'use client'

import { Suspense } from 'react'
import PaymentSuccessContent from './payment-success-content'
import { PortalScreen } from '@/components/portal/shell'
import { ResultCard } from '@/components/portal/result-card'

export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <PortalScreen>
      <ResultCard tone="loading" title="Confirming your payment…" />
    </PortalScreen>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
