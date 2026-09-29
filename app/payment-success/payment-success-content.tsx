'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PortalScreen } from '@/components/portal/shell'
import { ResultCard } from '@/components/portal/result-card'
import { btn } from '@/components/portal/ui'
import Link from "next/link"

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [returnHref, setReturnHref] = useState('/dashboard?refresh=true')
  const [returnLabel, setReturnLabel] = useState('Return to Dashboard')

  useEffect(() => {
    const resolveReturnTarget = async () => {
      const source = searchParams.get('source')
      const sourceIndicatesAdmin = source === 'admin'

      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const session = await response.json()
          const isAdmin = sourceIndicatesAdmin || session?.role === 'admin'
          setReturnHref(isAdmin ? '/admin?tab=orders&refresh=true' : '/dashboard?refresh=true')
          setReturnLabel(isAdmin ? 'Return to Admin Portal' : 'Return to Dashboard')
          return
        }
      } catch {
        // Fall back to the default dashboard target below.
      }

      setReturnHref(sourceIndicatesAdmin ? '/admin?tab=orders&refresh=true' : '/dashboard?refresh=true')
      setReturnLabel(sourceIndicatesAdmin ? 'Return to Admin Portal' : 'Return to Dashboard')
    }

    resolveReturnTarget()
  }, [searchParams])

  const isAdmin = returnHref.startsWith('/admin')

  return (
    <PortalScreen>
      <ResultCard
        tone="success"
        title="Payment received"
        actions={
          <>
            <Link href={isAdmin ? returnHref : '/dashboard?tab=orders&refresh=true'} className={btn.primary}>
              {isAdmin ? returnLabel : 'View your orders'}
            </Link>
            {!isAdmin && (
              <Link href="/dashboard?tab=shop" className={btn.secondary}>
                Continue shopping
              </Link>
            )}
          </>
        }
      >
        <p>Thank you. PayFast has accepted your payment and we are confirming your order.</p>
        <p>A confirmation email will follow shortly.</p>
      </ResultCard>
    </PortalScreen>
  )
}
