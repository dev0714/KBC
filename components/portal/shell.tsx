'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  ChevronDown,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Phone,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react'
import { portalFontVars } from './fonts'

type NavItem = { id: string; label: string; icon: typeof LayoutDashboard; badge?: number }

const MOBILE_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'shop', label: 'Shop', icon: BookOpen },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'account', label: 'Account', icon: User },
]

export const tabHref = (id: string) => (id === 'overview' ? '/dashboard' : `/dashboard?tab=${id}`)

// A nav target is a button when the dashboard can switch tabs in place,
// otherwise a link into the dashboard.
function NavTarget({
  id,
  onNavigate,
  className,
  children,
  ...rest
}: { id: string; onNavigate?: (tab: string) => void; className: string; children: React.ReactNode } & React.AriaAttributes) {
  return onNavigate ? (
    <button type="button" onClick={() => onNavigate(id)} className={className} {...rest}>
      {children}
    </button>
  ) : (
    <Link href={tabHref(id)} className={className} {...rest}>
      {children}
    </Link>
  )
}

// Sidebar, top bar and phone tab bar shared by every page of the client
// portal. On the dashboard itself tabs switch in place (onNavigate); other
// portal pages link back into the dashboard.
export function PortalShell({
  active,
  crumb,
  onNavigate,
  displayName,
  accountNumber,
  cartUnits,
  wishlistCount,
  onSearch,
  children,
}: {
  active: string
  crumb?: string
  onNavigate?: (tab: string) => void
  displayName?: string
  accountNumber?: string
  cartUnits: number
  wishlistCount: number
  onSearch?: (term: string) => void
  children: React.ReactNode
}) {
  const router = useRouter()
  const [term, setTerm] = useState('')

  const nav: Array<NavItem | { section: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { section: 'Purchasing' },
    { id: 'shop', label: 'Shop catalog', icon: BookOpen },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartUnits },
    { section: 'Account' },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'account', label: 'Account settings', icon: User },
  ]
  const label = crumb ?? (nav.find((n) => 'id' in n && n.id === active) as NavItem | undefined)?.label ?? 'Overview'
  const name = displayName || 'Your account'
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'KB'

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* sign-out still continues to the login page */
    }
    window.location.href = '/login'
  }

  const cartBadge = (cls: string) =>
    cartUnits > 0 ? <span className={`kbc-mono absolute flex items-center justify-center rounded-full bg-[#C8102E] px-1 text-white ${cls}`}>{cartUnits}</span> : null

  return (
    <div className={`kbc-portal ${portalFontVars} min-h-screen bg-[#F4F5F7] text-[#121826]`}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-[#0F1B3D] px-3.5 py-5 text-[#C9D1E4] lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 border-b border-[#24345F] px-1.5 pb-5">
          <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
          <span className="flex flex-col gap-0.5">
            <span className="kbc-display whitespace-nowrap text-[14px] font-bold text-white">KBC Brake &amp; Clutch</span>
            <span className="text-xs text-[#9AA5C1]">Trade client portal</span>
          </span>
        </Link>
        <nav aria-label="Portal" className="mt-3 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map((item) =>
            'section' in item ? (
              <div key={item.section} className="px-3 pb-1.5 pt-[18px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8C98B7]">
                {item.section}
              </div>
            ) : (
              <NavTarget
                onNavigate={onNavigate}
                key={item.id}
                id={item.id}
                aria-current={active === item.id ? 'page' : undefined}
                className={`relative flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                  active === item.id ? 'bg-[#1E2C57] text-white' : 'text-[#C9D1E4] hover:bg-[#17244A] hover:text-white'
                }`}
              >
                {active === item.id && <span className="absolute left-0 h-[18px] w-[3px] rounded-r bg-[#C8102E]" />}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
                {!!item.badge && (
                  <span className="kbc-mono ml-auto flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#26365F] px-1.5 text-[11px] text-[#E6EAF4]">
                    {item.badge}
                  </span>
                )}
              </NavTarget>
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-lg border border-[#24345F] p-3.5">
            <span className="text-xs font-semibold text-white">Sales desk</span>
            <a href="tel:+27114931336" className="flex items-center gap-2 text-[13px] text-[#C9D1E4] hover:text-white">
              <Phone className="h-3.5 w-3.5" />
              <span className="kbc-mono">011 493 1336</span>
            </a>
            <a href="mailto:kbc1@telkomsa.net" className="flex items-center gap-2 text-[13px] text-[#C9D1E4] hover:text-white">
              <Mail className="h-3.5 w-3.5" />
              kbc1@telkomsa.net
            </a>
            <span className="text-xs text-[#9AA5C1]">Mon–Fri 08:00–17:00 · Sat 08:00–13:00</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-[#C9D1E4] transition hover:bg-[#17244A] hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2.5 bg-[#0F1B3D] pl-4 pr-2 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
            <span className="kbc-display text-[15px] font-bold text-white">Client portal</span>
          </Link>
          <NavTarget onNavigate={onNavigate} id="cart" aria-label={`Cart, ${cartUnits} items`} className="relative ml-auto flex h-11 w-11 items-center justify-center text-white">
            <ShoppingCart className="h-5 w-5" />
            {cartBadge('right-1 top-1.5 h-4 min-w-4 text-[10px]')}
          </NavTarget>
          <button type="button" onClick={logout} aria-label="Sign out" className="flex h-11 w-11 items-center justify-center text-white">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <header className="sticky top-0 z-20 hidden h-16 items-center gap-6 border-b border-[#E3E6EC] bg-white px-8 lg:flex">
          <span className="text-[13px] text-[#5A6272]">
            Portal <span className="text-[#A0A7B4]">/</span> <span className="font-medium text-[#121826]">{label}</span>
          </span>
          <form
            role="search"
            className="ml-auto flex h-10 w-[380px] items-center gap-2.5 rounded-md border border-[#D5DAE2] bg-white px-3 text-[#5A6272] focus-within:border-[#0F1B3D]"
            onSubmit={(e) => {
              e.preventDefault()
              if (onSearch) onSearch(term)
              else router.push(`/dashboard?tab=shop&q=${encodeURIComponent(term)}`)
            }}
          >
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="search"
              aria-label="Search parts"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search parts by name or SKU"
              className="h-full flex-1 border-0 bg-transparent text-sm text-[#121826] outline-none placeholder:text-[#8A919E]"
            />
          </form>
          <NavTarget
                onNavigate={onNavigate}
            id="cart"
            aria-label={`Cart, ${cartUnits} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#E3E6EC] bg-white hover:bg-[#F4F5F7]"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartBadge('-right-1.5 -top-1.5 h-[18px] min-w-[18px] text-[11px]')}
          </NavTarget>
          <div className="h-8 w-px bg-[#E3E6EC]" />
          <NavTarget onNavigate={onNavigate} id="account" className="flex items-center gap-3 text-left">
            <span className="kbc-display flex h-9 w-9 items-center justify-center rounded-full bg-[#E6EAF3] text-[13px] font-bold text-[#0F1B3D]">
              {initials}
            </span>
            <span className="flex flex-col gap-px">
              <span className="max-w-[220px] truncate text-sm font-semibold">{name}</span>
              {accountNumber && <span className="kbc-mono text-xs text-[#5A6272]">Acc. {accountNumber}</span>}
            </span>
            <ChevronDown className="h-4 w-4 text-[#5A6272]" />
          </NavTarget>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-6">{children}</div>
        </main>

        <nav aria-label="Portal sections" className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-[#E3E6EC] bg-white lg:hidden">
          {MOBILE_NAV.map((item) => (
            <NavTarget
                onNavigate={onNavigate}
              key={item.id}
              id={item.id}
              aria-current={active === item.id ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
                active === item.id ? 'font-semibold text-[#0F1B3D]' : 'font-medium text-[#5A6272]'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavTarget>
          ))}
        </nav>
      </div>
    </div>
  )
}

// Standalone pages outside the signed-in shell (payment results, loading).
export function PortalScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className={`kbc-portal ${portalFontVars} flex min-h-screen flex-col bg-[#F4F5F7] text-[#121826]`}>
      <header className="flex h-14 items-center gap-2.5 bg-[#0F1B3D] px-4 sm:px-8">
        <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
        <span className="kbc-display text-[15px] font-bold text-white">KBC Brake &amp; Clutch</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
    </div>
  )
}
