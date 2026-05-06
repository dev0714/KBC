'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get payment status from URL params
        const paymentStatus = searchParams.get('pf_payment_status')
        const mPaymentId = searchParams.get('m_payment_id')
        const source = searchParams.get('source')
        
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

        if (!mPaymentId) {
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
          }),
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Payment successful! Your order has been confirmed.')
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] items-center justify-center px-4">
      <div className="bg-slate-400/10 border border-slate-400/20 rounded-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
            <p className="text-slate-400">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
            <p className="text-slate-300 mb-6">{message}</p>
          <Button
              onClick={async () => router.push(await (async () => {
                if (searchParams.get('source') === 'admin') return '/admin?tab=orders&refresh=true'
                try {
                  const sessionResponse = await fetch('/api/auth/session')
                  if (sessionResponse.ok) {
                    const session = await sessionResponse.json()
                    if (session?.role === 'admin') return '/admin?tab=orders&refresh=true'
                  }
                } catch {
                  // Fall back below.
                }
                return '/dashboard'
              })())}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold w-full"
            >
              Return to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
