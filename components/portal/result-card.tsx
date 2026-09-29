import React from 'react'
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react'

const TONES = {
  loading: { icon: Loader2, cls: 'bg-[#EEF1F6] text-[#0F1B3D]', spin: true },
  success: { icon: CheckCircle2, cls: 'bg-[#E7F4EE] text-[#0B6B41]', spin: false },
  cancelled: { icon: XCircle, cls: 'bg-[#FFF4DB] text-[#7A4F00]', spin: false },
  error: { icon: AlertCircle, cls: 'bg-[#FDECEA] text-[#A4161A]', spin: false },
}

export function ResultCard({
  tone,
  title,
  children,
  actions,
}: {
  tone: keyof typeof TONES
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <section
      role={tone === 'loading' ? 'status' : undefined}
      className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-[#E3E6EC] bg-white px-7 py-9 text-center"
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${t.cls}`}>
        <t.icon className={`h-7 w-7 ${t.spin ? 'animate-spin' : ''}`} />
      </span>
      <h1 className="kbc-display text-[22px] font-semibold leading-7">{title}</h1>
      {children && <div className="flex flex-col gap-2 text-sm leading-[21px] text-[#5A6272]">{children}</div>}
      {actions && <div className="mt-2 flex w-full flex-col gap-2.5">{actions}</div>}
      <p className="mt-1 text-xs text-[#5A6272]">
        Questions? Call the sales desk on <span className="kbc-mono">011 493 1336</span>
      </p>
    </section>
  )
}
