'use client'

import { Suspense } from 'react'
import PaymentCallbackContent from './payment-callback-content'
import PaymentCallbackLoading from './loading'

export const dynamic = 'force-dynamic'

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackLoading />}>
      <PaymentCallbackContent />
    </Suspense>
  )
}
