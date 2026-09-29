'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PortalScreen } from '@/components/portal/shell'
import { ResultCard } from '@/components/portal/result-card'
import { btn } from '@/components/portal/ui'
import Link from 'next/link'

export default function PaymentCancelContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(true)
  const [message, setMessage] = useState('Updating your order status...')
  const [returnHref, setReturnHref] = useState('/dashboard?refresh=true')
  const [returnLabel, setReturnLabel] = useState('Return to Dashboard')

  const readCookie = (name: string) => {
    if (typeof document === 'undefined') return null
    const match = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${name}=`))
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
  }

  useEffect(() => {
    const markCancelled = async () => {
      try {
        const source = searchParams.get('source')
        const sourceIndicatesAdmin = source === 'admin'
        const orderIdFromQuery = searchParams.get('order_id')
        const orderNumberFromQuery = searchParams.get('order_number')
        const mPaymentId = searchParams.get('m_payment_id')
        const customStr1 = searchParams.get('custom_str1')
        const storedOrderId = sessionStorage.getItem('kbc_pending_order_id') || readCookie('kbc_pending_order_id')
        const storedOrderNumber = sessionStorage.getItem('kbc_pending_order_number') || readCookie('kbc_pending_order_number')
        const paymentStatus = searchParams.get('pf_payment_status') || 'CANCELLED'
        const adminReturnHref = '/admin?tab=orders&refresh=true'
        const customerReturnHref = '/dashboard?refresh=true'

        let isAdminFlow = sourceIndicatesAdmin
        if (!isAdminFlow) {
          try {
            const sessionResponse = await fetch('/api/auth/session')
            if (sessionResponse.ok) {
              const session = await sessionResponse.json()
              isAdminFlow = session?.role === 'admin'
            }
          } catch {
            // Ignore session lookup errors and fall back to customer dashboard.
          }
        }

        const orderReference = orderIdFromQuery || customStr1 || storedOrderId || orderNumberFromQuery || storedOrderNumber
        const resolvedReturnHref = isAdminFlow ? adminReturnHref : customerReturnHref
        const resolvedReturnLabel = isAdminFlow ? 'Return to Admin Portal' : 'Return to Portal'

        setReturnHref(resolvedReturnHref)
        setReturnLabel(resolvedReturnLabel)

        if (!mPaymentId && !orderReference) {
          setMessage('Your payment was cancelled. We could not identify the order from the return URL.')
          setIsUpdating(false)
          return
        }

        const response = await fetch('/api/payfast/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pf_payment_status: paymentStatus,
            m_payment_id: mPaymentId,
            custom_str1: orderReference,
            order_id: orderIdFromQuery || storedOrderId || undefined,
            order_number: orderNumberFromQuery || storedOrderNumber || undefined,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setMessage(data.newStatus === 'Cancelled'
            ? 'Your payment was cancelled and the order has been updated.'
            : data.message || 'Your payment was cancelled.')
          sessionStorage.removeItem('kbc_pending_order_id')
          sessionStorage.removeItem('kbc_pending_order_number')
          sessionStorage.removeItem('kbc_pending_payment_method')
          document.cookie = 'kbc_pending_order_id=; path=/; max-age=0; samesite=lax'
          document.cookie = 'kbc_pending_order_number=; path=/; max-age=0; samesite=lax'
          document.cookie = 'kbc_pending_payment_method=; path=/; max-age=0; samesite=lax'
          if (isAdminFlow) {
            router.replace(resolvedReturnHref)
          }
        } else {
          setMessage(data.message || 'Your payment was cancelled, but the order could not be updated automatically.')
        }
      } catch (error) {
        console.error('[v0] Payment cancel error:', error)
        setMessage('Your payment was cancelled, but we could not update the order automatically.')
      } finally {
        setIsUpdating(false)
      }
    }

    markCancelled()
  }, [searchParams])

  const isAdmin = returnHref.startsWith('/admin')

  return (
    <PortalScreen>
      <ResultCard
        tone={isUpdating ? 'loading' : 'cancelled'}
        title={isUpdating ? 'Updating your order…' : 'Payment cancelled'}
        actions={
          isUpdating ? undefined : (
            <>
              <Link href={isAdmin ? returnHref : '/dashboard?tab=cart'} className={btn.primary}>
                {isAdmin ? returnLabel : 'Back to cart'}
              </Link>
              {!isAdmin && (
                <Link href="/dashboard?tab=orders&refresh=true" className={btn.secondary}>
                  View your orders
                </Link>
              )}
            </>
          )
        }
      >
        <p>{message}</p>
      </ResultCard>
    </PortalScreen>
  )
}
