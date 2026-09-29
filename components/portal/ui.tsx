import React from 'react'

// Shared building blocks for the client portal's light theme.

export const ACCENT = '#C8102E'

export const card = 'rounded-lg border border-[#E3E6EC] bg-white'
export const th =
  'whitespace-nowrap border-b border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5 text-left text-xs font-semibold text-[#5A6272]'
export const td = 'whitespace-nowrap border-b border-[#EEF0F3] px-4 py-3.5 text-sm'
export const input =
  'h-10 w-full rounded-md border border-[#D5DAE2] bg-white px-3 text-sm text-[#121826] placeholder:text-[#8A919E] outline-none transition focus:border-[#0F1B3D] focus:ring-2 focus:ring-[#0F1B3D]/15 disabled:bg-[#F4F5F7]'

const btnBase =
  'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
export const btn = {
  primary: `${btnBase} bg-[#C8102E] text-white hover:bg-[#A50D26] focus-visible:ring-[#C8102E]`,
  navy: `${btnBase} bg-[#0F1B3D] text-white hover:bg-[#1E2C57] focus-visible:ring-[#0F1B3D]`,
  secondary: `${btnBase} border border-[#CBD2DD] bg-white text-[#121826] hover:bg-[#F4F5F7] focus-visible:ring-[#0F1B3D]`,
  small: 'h-9 px-3.5',
}
export const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E3E6EC] bg-white text-[#121826] transition hover:bg-[#F4F5F7] disabled:opacity-50'

export function formatRand(value: number | string | null | undefined) {
  const n = Number(value ?? 0)
  const [int, dec] = Math.abs(n).toFixed(2).split('.')
  return `${n < 0 ? '−' : ''}R ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${dec}`
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatBytes(size?: number | string | null) {
  const n = Number(size)
  if (!n) return '—'
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

const STATUS: Record<string, string> = {
  paid: 'bg-[#E7F4EE] text-[#0B6B41]',
  completed: 'bg-[#E7F4EE] text-[#0B6B41]',
  active: 'bg-[#E7F4EE] text-[#0B6B41]',
  pending: 'bg-[#FFF4DB] text-[#7A4F00]',
  failed: 'bg-[#FDECEA] text-[#A4161A]',
  shipped: 'bg-[#E6EAF3] text-[#0F1B3D]',
}

export function StatusPill({ status }: { status?: string | null }) {
  const label = status || 'Pending'
  const cls = STATUS[label.toLowerCase()] ?? 'bg-[#EEF0F3] text-[#4A515E]'
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export function PageHead({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight text-[#121826] sm:text-[28px] sm:leading-[34px]">
          {title}
        </h1>
        {sub && <p className="text-sm text-[#5A6272]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

export function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <h2 className="kbc-display text-[17px] font-semibold text-[#121826]">{title}</h2>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1F6] text-[#0F1B3D]">{icon}</span>
      <p className="text-[15px] font-semibold text-[#121826]">{title}</p>
      <p className="max-w-sm text-sm text-[#5A6272]">{text}</p>
      {action}
    </div>
  )
}

export function StockLabel({ qty }: { qty?: number | null }) {
  const n = Number(qty ?? 0)
  const [label, color] =
    n <= 0 ? ['Out of stock', 'text-[#5A6272]'] : n <= 5 ? [`Low stock · ${n} left`, 'text-[#7A4F00]'] : [`In stock · ${n}`, 'text-[#0B6B41]']
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
