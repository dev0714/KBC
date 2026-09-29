'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PortalScreen } from '@/components/portal/shell'
import { ResultCard } from '@/components/portal/result-card'
import { btn } from '@/components/portal/ui'

export default function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'cancelled' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get payment status from URL params
        const paymentStatus = searchParams.get('pf_payment_status')
        const mPaymentId = searchParams.get('m_payment_id')
        const source = searchParams.get('source')
        const orderIdFromQuery = searchParams.get('order_id')
        const orderNumberFromQuery = searchParams.get('order_number')
        const customStr1FromQuery = searchParams.get('custom_str1')
        const storedOrderId = sessionStorage.getItem('kbc_pending_order_id')
        const storedOrderNumber = sessionStorage.getItem('kbc_pending_order_number')
        
        console.log('[v0] Payment callback received:', { paymentStatus, mPaymentId })

        const resolveReturnTarget = async () => {
          if (source === 'admin') return '/admin?tab=orders&refresh=true'

          try {
            const sessionResponse = await fetch('/api/auth/session')
            if (sessionResponse.ok) {
              const session = await sessionResponse.json()
              if (session?.role === 'admin') {
                return '/admin?tab=orders&refresh=true'
              }
            }
          } catch {
            // Ignore session lookup errors and use the customer dashboard fallback.
          }

          return '/dashboard'
        }

        const orderReference = orderIdFromQuery || customStr1FromQuery || storedOrderId || orderNumberFromQuery || storedOrderNumber || null

        if (paymentStatus === 'CANCELLED') {
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
            setStatus('cancelled')
            setMessage(data.newStatus === 'Cancelled'
              ? 'Your payment was cancelled and the order has been updated.'
              : data.message || 'Your payment was cancelled.')
            setTimeout(async () => router.push(await resolveReturnTarget()), 3000)
          } else {
            setStatus('failed')
            setMessage(data.message || 'Payment cancellation could not be confirmed')
          }
          return
        }

        if (!mPaymentId && !orderReference) {
          setStatus('success')
          setMessage('Payment received. We are confirming your order now.')
          setTimeout(async () => router.push(await resolveReturnTarget()), 3000)
          return
        }

        // Verify payment with server
        const response = await fetch('/api/payfast/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pf_payment_status: paymentStatus,
            m_payment_id: mPaymentId,
            custom_str1: orderReference || undefined,
            order_id: orderIdFromQuery || storedOrderId || undefined,
            order_number: orderNumberFromQuery || storedOrderNumber || undefined,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Your payment was successful and your order is confirmed.')
          // Redirect to dashboard after 3 seconds
          setTimeout(async () => router.push(await resolveReturnTarget()), 3000)
        } else {
          setStatus('failed')
          setMessage(data.message || 'Payment verification failed')
        }
      } catch (error) {
        console.error('[v0] Payment callback error:', error)
        setStatus('failed')
        setMessage('An error occurred processing your payment')
      }
    }

    processPayment()
  }, [searchParams, router])

  const goBack = async () => {
    if (searchParams.get('source') === 'admin') return router.push('/admin?tab=orders&refresh=true')
    try {
      const sessionResponse = await fetch('/api/auth/session')
      if (sessionResponse.ok) {
        const session = await sessionResponse.json()
        if (session?.role === 'admin') return router.push('/admin?tab=orders&refresh=true')
      }
    } catch {
      // Fall back below.
    }
    router.push('/dashboard?tab=orders&refresh=true')
  }

  const titles = {
    loading: 'Checking your payment…',
    success: 'Payment received',
    cancelled: 'Payment cancelled',
    failed: 'We could not confirm your payment',
  }

  return (
    <PortalScreen>
      <ResultCard
        tone={status === 'failed' ? 'error' : status}
        title={titles[status]}
        actions={
          status === 'failed' ? (
            <button type="button" onClick={goBack} className={btn.primary}>
              Return to your orders
            </button>
          ) : undefined
        }
      >
        <p>{status === 'loading' ? 'Please wait while we confirm the result with PayFast.' : message}</p>
        {(status === 'success' || status === 'cancelled') && <p>Taking you back to the portal…</p>}
        {status === 'failed' && <p>If money left your account, contact us and we will sort it out.</p>}
      </ResultCard>
    </PortalScreen>
  )
}
