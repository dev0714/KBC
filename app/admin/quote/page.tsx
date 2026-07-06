'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { CourierQuotePanel } from '@/components/admin/courier/quote-panel'

// Standalone deep-link for the quote tool; the same panel is embedded as the
// "Courier Quote" tab inside /admin.
export default function QuotePage() {
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'denied'>('checking')

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthState(data?.user?.role === 'admin' || data?.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => setAuthState('denied'))
  }, [])

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050e2e]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }
  if (authState === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050e2e] text-slate-300">
        Admin access required.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050e2e] via-[#07163f] to-[#0b2a5b] text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="outline"
          className="border-slate-600/50 gap-2"
          onClick={() => {
            window.location.href = '/admin'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Admin
        </Button>
        <CourierQuotePanel />
      </div>
    </div>
  )
}
