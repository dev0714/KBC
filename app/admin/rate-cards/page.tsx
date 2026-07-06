'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { RateCardsPanel } from '@/components/admin/courier/rate-cards-panel'

// Standalone deep-link for rate-card management; the same panel is embedded
// as the "Rate Cards" tab inside /admin.
export default function RateCardsPage() {
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'denied'>('checking')

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthState(data?.user?.role === 'admin' || data?.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => setAuthState('denied'))
  }, [])

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }
  if (authState === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        Admin access required.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
        <RateCardsPanel />
      </div>
    </div>
  )
}
