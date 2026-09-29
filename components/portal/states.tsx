'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2 } from 'lucide-react'
import { portalFontVars } from './fonts'

// Route-level loading and error screens for the client portal, so a slow or
// failed page never leaves the site's dark background showing on its own.

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`kbc-portal ${portalFontVars} flex min-h-screen flex-col bg-[#F4F5F7] text-[#121826]`}>
      <header className="flex h-14 items-center gap-2.5 bg-[#0F1B3D] px-4 sm:px-8">
        <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
        <span className="kbc-display text-[15px] font-bold text-white">Client portal</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
    </div>
  )
}

export function PortalLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <Frame>
      <div role="status" className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F1B3D]" />
        <p className="text-sm font-medium text-[#5A6272]">{label}</p>
      </div>
    </Frame>
  )
}

export function PortalError({ error, reset, backHref, backLabel }: { error: Error & { digest?: string }; reset: () => void; backHref: string; backLabel: string }) {
  useEffect(() => {
    console.error('[portal] page error', error)
  }, [error])
  return (
    <Frame>
      <section role="alert" className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[#E3E6EC] bg-white px-7 py-9 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDECEA] text-[#A4161A]">
          <AlertCircle className="h-7 w-7" />
        </span>
        <h1 className="kbc-display text-[22px] font-semibold">This page could not be shown</h1>
        <p className="text-sm leading-[21px] text-[#5A6272]">Something went wrong while loading it. Please try again.</p>
        {error.digest && <p className="kbc-mono text-xs text-[#8A919E]">Reference {error.digest}</p>}
        <div className="mt-2 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#C8102E] px-4 text-sm font-semibold text-white hover:bg-[#A50D26]"
          >
            Try again
          </button>
          <Link
            href={backHref}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#CBD2DD] bg-white px-4 text-sm font-semibold hover:bg-[#F4F5F7]"
          >
            {backLabel}
          </Link>
        </div>
        <p className="text-xs text-[#5A6272]">
          Still stuck? Call the sales desk on <span className="kbc-mono">011 493 1336</span>
        </p>
      </section>
    </Frame>
  )
}
