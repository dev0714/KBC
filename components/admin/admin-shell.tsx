'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CreditCard,
  Database,
  FileSignature,
  LogOut,
  Menu,
  Package,
  Send,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { portalFontVars } from '@/components/portal/fonts'

type Item = { id: string; label: string; icon: typeof BarChart3 }

export const ADMIN_NAV: Array<{ section?: string; items: Item[] }> = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'reporting', label: 'Reporting', icon: Database },
    ],
  },
  {
    section: 'Sales',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingCart },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'payment', label: 'Payment links', icon: CreditCard },
      { id: 'products', label: 'Products', icon: Package },
    ],
  },
  {
    section: 'Accounts',
    items: [{ id: 'credit-applications', label: 'Credit applications', icon: FileSignature }],
  },
  {
    section: 'Logistics',
    items: [
      { id: 'quote', label: 'Courier quote', icon: Send },
      { id: 'rate-cards', label: 'Rate cards', icon: TrendingUp },
    ],
  },
  { section: 'System', items: [{ id: 'settings', label: 'Settings', icon: AlertCircle }] },
]

// Frame for the admin area: the client portal's navy sidebar, white top bar
// and light workspace, with admin navigation.
export function AdminShell({
  active,
  onNavigate,
  onLogout,
  children,
}: {
  active: string
  onNavigate: (tab: string) => void
  onLogout: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const label = ADMIN_NAV.flatMap((g) => g.items).find((i) => i.id === active)?.label ?? 'Overview'

  return (
    <div className={`kbc-portal ${portalFontVars} min-h-screen bg-[#F4F5F7] text-[#121826]`}>
      {open && <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-[#0F1B3D]/40 lg:hidden" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-[#0F1B3D] px-3.5 py-5 text-[#C9D1E4] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-[#24345F] px-1.5 pb-5">
          <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
          <span className="flex flex-col gap-0.5">
            <span className="kbc-display whitespace-nowrap text-[14px] font-bold text-white">KBC Brake &amp; Clutch</span>
            <span className="text-xs text-[#9AA5C1]">Admin workspace</span>
          </span>
        </div>
        <nav aria-label="Admin" className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {ADMIN_NAV.map((group, gi) => (
            <React.Fragment key={group.section ?? gi}>
              {group.section && (
                <div className="px-3 pb-1.5 pt-[18px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8C98B7]">{group.section}</div>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id)
                    setOpen(false)
                  }}
                  aria-current={active === item.id ? 'page' : undefined}
                  className={`relative flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                    active === item.id ? 'bg-[#1E2C57] text-white' : 'text-[#C9D1E4] hover:bg-[#17244A] hover:text-white'
                  }`}
                >
                  {active === item.id && <span className="absolute left-0 h-[18px] w-[3px] rounded-r bg-[#C8102E]" />}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm text-[#C9D1E4] transition hover:bg-[#17244A] hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E3E6EC] bg-white px-4 lg:h-16 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E3E6EC] lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-[13px] text-[#5A6272]">
            Admin <span className="text-[#A0A7B4]">/</span> <span className="font-medium text-[#121826]">{label}</span>
          </span>
          <a
            href="/dashboard"
            className="ml-auto hidden h-9 items-center rounded-md border border-[#CBD2DD] px-3 text-sm font-medium text-[#121826] hover:bg-[#F4F5F7] sm:inline-flex"
          >
            Customer view
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#5A6272] hover:bg-[#F4F5F7] hover:text-[#121826] max-sm:ml-auto"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>
        <main className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
