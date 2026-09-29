'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DOCUMENT_KINDS } from '@/lib/credit-application/schema'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileWarning,
  Link2,
  Loader2,
  MessageCircle,
  Printer,
  Save,
  Search,
} from 'lucide-react'

type Status = 'new' | 'in_review' | 'approved' | 'declined'

interface Summary {
  id: string
  reference: string
  status: Status
  sales_rep: string | null
  registered_name: string
  trading_name: string | null
  entity_type: string
  credit_limit_requested: number | null
  buyer_email: string | null
  signatory_name: string
  documentCount: number
  created_at: string
  reviewed_at: string | null
}

interface Contact {
  name: string
  designation: string
  email: string
  phone: string
}

interface Detail extends Summary {
  registration_number: string | null
  vat_number: string | null
  signature_png: string
  signed_date: string | null
  terms_version: string
  submitted_ip: string | null
  approved_credit_limit: number | null
  account_number: string | null
  admin_notes: string | null
  reviewed_by: string | null
  data: {
    physicalAddress: string
    postalAddress: string
    telephone: string
    fax: string
    dateEstablished: string
    buyerContact: Contact
    notificationsContact: Contact
    accountsContact: Contact
    bankName: string
    bankAccountName: string
    bankAccountNumber: string
    bankBranchCode: string
    bankBranchLocation: string
    creditLimit: string
    directors: { fullName: string; idNumber: string; interestHolding: string; position: string; residentialAddress: string }[]
    tradeReferences: { companyName: string; telephone: string; designation: string; contactPerson: string; estMonthlyPurchase: string }[]
    signatoryCapacity: string
    acceptTerms: boolean
    acceptSurety: boolean
    acceptCreditCheck: boolean
  }
  documents: { kind: string; name: string; size: number; path: string; uploaded: boolean; url: string | null }[]
}

const PANEL =
  'rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b2a5b]/90 to-[#07163f]/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl'
const EYEBROW = 'text-[11px] uppercase tracking-[0.35em] text-slate-400'
const FIELD = 'border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/40'

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'border-blue-400/40 bg-blue-500/15 text-blue-200' },
  in_review: { label: 'In review', cls: 'border-amber-400/40 bg-amber-500/15 text-amber-200' },
  approved: { label: 'Approved', cls: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' },
  declined: { label: 'Declined', cls: 'border-red-400/40 bg-red-500/15 text-red-300' },
}

const rand = (n: number | null | undefined) =>
  n == null ? '—' : `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status]
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${m.cls}`}>{m.label}</span>
}

function KV({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-line break-words text-sm text-white">{value || <span className="text-slate-500">—</span>}</p>
    </div>
  )
}

function ShareLinkCard() {
  const [origin, setOrigin] = useState('')
  const [rep, setRep] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => setOrigin(window.location.origin), [])

  const link = `${origin}/credit-application${rep.trim() ? `?rep=${encodeURIComponent(rep.trim())}` : ''}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked; the link is still selectable */
    }
  }
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Please complete the KBC Brake & Clutch credit application here: ${link}`,
  )}`

  return (
    <div className={`${PANEL} p-6 md:p-8`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg">
          <Link2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`${EYEBROW} mb-1`}>Share</p>
          <h2 className="text-xl font-bold text-white">Credit application link</h2>
          <p className="mt-1 text-sm text-slate-300">
            Send this to new customers. Add a rep&apos;s name to pre-fill the sales representative on the form.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
            <Input value={rep} onChange={(e) => setRep(e.target.value)} placeholder="Sales rep (optional)" className={FIELD} />
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2">
              <span className="truncate font-mono text-sm text-blue-200" title={link}>
                {link}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={copy}
              className="gap-2 bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-red-600"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button asChild variant="outline" className="gap-2 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Share on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Open form
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailView({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [app, setApp] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ approvedCreditLimit: '', accountNumber: '', adminNotes: '' })

  const load = useCallback(async () => {
    setError('')
    const res = await fetch(`/api/admin/credit-applications/${id}`)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to load application')
      return
    }
    const a: Detail = data.application
    setApp(a)
    setForm({
      approvedCreditLimit: a.approved_credit_limit != null ? String(a.approved_credit_limit) : '',
      accountNumber: a.account_number ?? '',
      adminNotes: a.admin_notes ?? '',
    })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/credit-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      await load()
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  if (error && !app) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All applications
        </button>
        <p className="flex items-center gap-2 text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      </div>
    )
  }
  if (!app) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const d = app.data
  const kindLabel = (k: string) => DOCUMENT_KINDS.find((x) => x.id === k)?.label ?? k
  const missingRequired = DOCUMENT_KINDS.filter((k) => k.required && !app.documents.some((x) => x.kind === k.id && x.uploaded))

  const contact = (title: string, c: Contact) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-sm font-bold text-white">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <KV label="Name" value={c.name} />
        <KV label="Designation" value={c.designation} />
        <KV label="Email" value={c.email ? <a className="text-blue-200 hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : ''} />
        <KV label="Tel / cell" value={c.phone ? <a className="text-blue-200 hover:underline" href={`tel:${c.phone}`}>{c.phone}</a> : ''} />
      </div>
    </div>
  )

  return (
    <div className="credit-application-print space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All applications
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.print()}
          className="gap-2 border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
        >
          <Printer className="h-4 w-4" /> Print / save PDF
        </Button>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`${EYEBROW} mb-2`}>Credit application · {app.reference}</p>
            <h1 className="text-3xl font-black tracking-tight text-white">{app.registered_name}</h1>
            {app.trading_name && <p className="mt-1 text-slate-300">t/a {app.trading_name}</p>}
            <p className="mt-2 text-sm text-slate-400">Submitted {when(app.created_at)}{app.sales_rep ? ` · Rep: ${app.sales_rep}` : ''}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Limit requested', rand(app.credit_limit_requested)],
            ['Entity', app.entity_type],
            ['Owners / directors', String(d.directors.length)],
            ['Documents', `${app.documents.filter((x) => x.uploaded).length} uploaded`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{label}</p>
              <p className="mt-3 text-xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decision */}
      <div className={`${PANEL} p-6 md:p-8 print:hidden`}>
        <p className={`${EYEBROW} mb-2`}>Decision</p>
        <h2 className="mb-4 text-xl font-bold text-white">Review</h2>
        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(STATUS_META) as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving || app.status === s}
              onClick={() => patch({ status: s })}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                app.status === s ? STATUS_META[s].cls : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-slate-400">Approved limit (R)</span>
            <Input
              value={form.approvedCreditLimit}
              onChange={(e) => setForm((f) => ({ ...f, approvedCreditLimit: e.target.value }))}
              inputMode="decimal"
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-slate-400">Account number</span>
            <Input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} className={FIELD} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.28em] text-slate-400">Internal notes</span>
            <textarea
              rows={3}
              value={form.adminNotes}
              onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/50"
              placeholder="Credit bureau result, reference checks, follow-ups…"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={saving}
            onClick={() => patch(form)}
            className="gap-2 bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-red-600"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          {error && <span className="text-sm text-red-300">{error}</span>}
          {app.reviewed_at && (
            <span className="text-xs text-slate-400">
              Last reviewed {when(app.reviewed_at)}
              {app.reviewed_by ? ` by ${app.reviewed_by}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <p className={`${EYEBROW} mb-2`}>Company</p>
        <h2 className="mb-5 text-xl font-bold text-white">Company details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <KV label="Registration no." value={app.registration_number} />
          <KV label="VAT no." value={app.vat_number} />
          <KV label="Date established" value={d.dateEstablished} />
          <KV label="Telephone" value={d.telephone} />
          <KV label="Fax" value={d.fax} />
          <KV label="Sales representative" value={app.sales_rep} />
          <KV label="Physical address" value={d.physicalAddress} />
          <KV label="Postal address" value={d.postalAddress} />
        </div>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <p className={`${EYEBROW} mb-2`}>People</p>
        <h2 className="mb-5 text-xl font-bold text-white">Contacts</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {contact('Buyer', d.buyerContact)}
          {contact('Notifications & promotions', d.notificationsContact)}
          {contact('Accounts department', d.accountsContact)}
        </div>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <p className={`${EYEBROW} mb-2`}>Finance</p>
        <h2 className="mb-5 text-xl font-bold text-white">Banking details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <KV label="Bank" value={d.bankName} />
          <KV label="Account name" value={d.bankAccountName} />
          <KV label="Account number" value={d.bankAccountNumber} />
          <KV label="Branch code" value={d.bankBranchCode} />
          <KV label="Branch location" value={d.bankBranchLocation} />
          <KV label="Credit limit required" value={rand(app.credit_limit_requested)} />
        </div>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <p className={`${EYEBROW} mb-2`}>Sureties</p>
        <h2 className="mb-5 text-xl font-bold text-white">Directorship / owners</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {d.directors.map((o, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-sm font-bold text-white">{o.fullName}</p>
              <div className="grid grid-cols-2 gap-3">
                <KV label="ID number" value={o.idNumber} />
                <KV label="Position" value={o.position} />
                <KV label="Interest holding" value={o.interestHolding ? `${o.interestHolding.replace('%', '')}%` : ''} />
                <KV label="Residential address" value={o.residentialAddress} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${PANEL} overflow-hidden`}>
        <div className="px-6 pb-4 pt-6 md:px-8 md:pt-8">
          <p className={`${EYEBROW} mb-2`}>Checks</p>
          <h2 className="text-xl font-bold text-white">Trade references</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-white/10 bg-white/5">
                {['Company', 'Contact person', 'Telephone', 'Designation', 'Est. monthly'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400 md:px-8">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.tradeReferences.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-3 font-bold text-white md:px-8">{r.companyName}</td>
                  <td className="px-6 py-3 text-slate-200 md:px-8">{r.contactPerson}</td>
                  <td className="px-6 py-3 md:px-8">
                    <a className="text-blue-200 hover:underline" href={`tel:${r.telephone}`}>
                      {r.telephone}
                    </a>
                  </td>
                  <td className="px-6 py-3 text-slate-300 md:px-8">{r.designation || '—'}</td>
                  <td className="px-6 py-3 text-slate-300 md:px-8">{r.estMonthlyPurchase ? `R ${r.estMonthlyPurchase}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <p className={`${EYEBROW} mb-2`}>Attachments</p>
        <h2 className="mb-5 text-xl font-bold text-white">Supporting documents</h2>
        {missingRequired.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Outstanding: {missingRequired.map((k) => k.label.split(' (')[0]).join('; ')}</span>
          </div>
        )}
        {app.documents.length === 0 ? (
          <p className="text-sm text-slate-400">No documents were attached.</p>
        ) : (
          <ul className="space-y-2">
            {app.documents.map((doc) => (
              <li key={doc.path} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{doc.name}</p>
                  <p className="text-xs text-slate-400">
                    {kindLabel(doc.kind).split(' (')[0]} · {(doc.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                {doc.uploaded && doc.url ? (
                  <a
                    href={doc.url}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-bold text-red-300 hover:bg-red-500/10 print:hidden"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                ) : (
                  <span className="text-xs font-bold text-amber-300">Upload did not complete</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500 print:hidden">Download links expire after 10 minutes — reopen the application for fresh links.</p>
      </div>

      <div className={`${PANEL} p-6 md:p-8`}>
        <p className={`${EYEBROW} mb-2`}>Agreement</p>
        <h2 className="mb-5 text-xl font-bold text-white">Signature</h2>
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-2 gap-4">
            <KV label="Signatory" value={app.signatory_name} />
            <KV label="Capacity" value={d.signatoryCapacity} />
            <KV label="Date signed" value={app.signed_date} />
            <KV label="Terms version" value={app.terms_version} />
            <KV
              label="Accepted"
              value={[
                d.acceptTerms && 'Terms & conditions',
                d.acceptSurety && 'Suretyship',
                d.acceptCreditCheck && 'Credit checks',
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            <KV label="Submitted from IP" value={app.submitted_ip} />
          </div>
          <div className="rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={app.signature_png} alt={`Signature of ${app.signatory_name}`} className="h-36 w-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CreditApplicationsPanel({ initialId }: { initialId?: string | null }) {
  const [apps, setApps] = useState<Summary[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(initialId ?? null)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/credit-applications')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to load applications')
        setApps([])
      } else {
        setApps(data.applications)
      }
    } catch {
      setError('Network error loading applications')
      setApps([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps?.length ?? 0 }
    for (const a of apps ?? []) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [apps])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (apps ?? []).filter(
      (a) =>
        (filter === 'all' || a.status === filter) &&
        (!q ||
          [a.reference, a.registered_name, a.trading_name, a.signatory_name, a.sales_rep, a.buyer_email]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))),
    )
  }, [apps, filter, query])

  if (openId) {
    return (
      <DetailView
        id={openId}
        onBack={() => {
          setOpenId(null)
          load()
        }}
        onChanged={load}
      />
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-slate-400">Accounts</p>
        <h1 className="text-4xl font-black tracking-tight text-white">Credit Applications</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Online credit applications submitted through the website, with signed terms and supporting documents.
        </p>
      </div>

      <ShareLinkCard />

      <div className={`${PANEL} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-6 md:px-8 md:pt-8">
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'in_review', 'approved', 'declined'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${
                  filter === s
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_META[s].label}
                <span className="ml-1.5 text-xs opacity-70">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, reference, rep…" className={`pl-9 ${FIELD}`} />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-2 px-6 pb-4 text-sm text-red-300 md:px-8">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        {apps === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : visible.length === 0 ? (
          <p className="border-t border-white/10 px-6 py-12 text-center text-sm text-slate-400 md:px-8">
            {apps.length === 0 ? 'No applications yet — share the link above to get started.' : 'No applications match this filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-white/10 bg-white/5">
                  {['Company', 'Reference', 'Limit requested', 'Docs', 'Rep', 'Submitted', 'Status'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setOpenId(a.id)}
                    className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.05]"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{a.registered_name}</p>
                      <p className="text-xs text-slate-400">{a.entity_type} · {a.signatory_name}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-300">{a.reference}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-white tabular-nums">{rand(a.credit_limit_requested)}</td>
                    <td className="px-6 py-4 text-slate-300">{a.documentCount}</td>
                    <td className="px-6 py-4 text-slate-300">{a.sales_rep || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-400">{when(a.created_at)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
