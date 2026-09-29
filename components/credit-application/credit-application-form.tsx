'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  ALLOWED_MIME,
  type Contact,
  CreditApplicationInput,
  DOCUMENT_KINDS,
  type DocumentKind,
  ENTITY_TYPES,
  type FieldErrors,
  MAX_FILE_BYTES,
  STEPS,
  emptyApplication,
  emptyDirector,
  validateDocuments,
  validateStep,
} from '@/lib/credit-application/schema'
import { CREDIT_TERMS, TERMS_OF_APPLICATION } from '@/lib/credit-application/terms'
import { SignaturePad } from './signature-pad'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

const DRAFT_KEY = 'kbc-credit-application-draft'

const INPUT =
  'w-full rounded-lg border bg-white/10 px-3 py-2.5 text-white placeholder:text-white/40 outline-none transition focus:border-white/60 focus:bg-white/15 [color-scheme:dark]'
const CARD = 'rounded-2xl border border-white/20 bg-white/10 p-6 md:p-8 shadow-xl shadow-black/10 backdrop-blur-sm'

type UploadItem = { kind: DocumentKind; file: File }

function Field({
  label,
  error,
  required,
  hint,
  children,
  className = '',
}: {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-white">
        {label}
        {required && <span className="text-red-300"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-white/60">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-300">{error}</span>}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  error,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={Boolean(error)}
      className={`${INPUT} ${error ? 'border-red-400' : 'border-white/20'}`}
    />
  )
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-xl font-bold text-white">{children}</h3>
      {sub && <p className="mt-1 text-sm text-white/70">{sub}</p>}
    </div>
  )
}

export function CreditApplicationForm() {
  const params = useSearchParams()
  const [app, setApp] = useState<CreditApplicationInput>(emptyApplication)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState<{ reference: string; failedUploads: string[] } | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  // Restore a saved draft (never the signature) and apply the ?rep= link.
  useEffect(() => {
    let base = emptyApplication()
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) base = { ...base, ...JSON.parse(raw), signature: '' }
    } catch {
      /* ignore unreadable drafts */
    }
    const rep = params.get('rep')
    if (rep) base.salesRep = rep.slice(0, 100)
    setApp(base)
    setDraftLoaded(true)
  }, [params])

  useEffect(() => {
    if (!draftLoaded || done) return
    const t = setTimeout(() => {
      try {
        const { signature: _s, ...rest } = app
        localStorage.setItem(DRAFT_KEY, JSON.stringify(rest))
      } catch {
        /* storage unavailable */
      }
    }, 400)
    return () => clearTimeout(t)
  }, [app, draftLoaded, done])

  const set = <K extends keyof CreditApplicationInput>(key: K, value: CreditApplicationInput[K]) =>
    setApp((a) => ({ ...a, [key]: value }))

  const setContact = (key: 'buyerContact' | 'notificationsContact' | 'accountsContact', field: keyof Contact, v: string) =>
    setApp((a) => ({ ...a, [key]: { ...a[key], [field]: v } }))

  const setListItem = <L extends 'directors' | 'tradeReferences'>(
    list: L,
    index: number,
    field: keyof CreditApplicationInput[L][number],
    v: string,
  ) =>
    setApp((a) => ({
      ...a,
      [list]: (a[list] as unknown as Array<Record<string, string>>).map((item, i) => (i === index ? { ...item, [field]: v } : item)),
    }))

  const copyContact = (from: 'buyerContact', to: 'notificationsContact' | 'accountsContact') =>
    setApp((a) => ({ ...a, [to]: { ...a[from] } }))

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const next = () => {
    const e = validateStep(step, app)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    scrollTop()
  }

  const back = () => {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
    scrollTop()
  }

  const addFiles = (kind: DocumentKind, files: FileList | null) => {
    if (!files) return
    setUploadError('')
    const added: UploadItem[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_MIME.includes(file.type)) {
        setUploadError(`${file.name}: only PDF, JPG, PNG, WEBP or HEIC files are accepted`)
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setUploadError(`${file.name} is larger than 10 MB`)
        continue
      }
      added.push({ kind, file })
    }
    setUploads((u) => [...u, ...added])
  }

  const missingRequiredDocs = useMemo(
    () => DOCUMENT_KINDS.filter((k) => k.required && !uploads.some((u) => u.kind === k.id)),
    [uploads],
  )

  const submit = async () => {
    const e = validateStep(4, app)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      )
      return
    }
    const declared = uploads.map((u) => ({ kind: u.kind, name: u.file.name, size: u.file.size, type: u.file.type }))
    const docError = validateDocuments(declared)
    if (docError) {
      setUploadError(docError)
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setProgress('Submitting application…')
    try {
      const res = await fetch('/api/credit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: app, documents: declared, website: honeypot }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
          const serverKeys = Object.keys(data.fieldErrors)
          const firstStep = STEPS.findIndex((_, i) =>
            Object.keys(validateStep(i, emptyApplication())).some((k) => serverKeys.includes(k)),
          )
          if (firstStep >= 0 && firstStep !== step) setStep(firstStep)
        }
        setSubmitError(data.error ?? 'Submission failed')
        return
      }

      // The application is saved at this point: upload problems must never
      // surface as a submission failure, or the customer will submit twice.
      const failed: string[] = []
      const tokens: { path: string; token: string }[] = data.uploads ?? []
      let supabase: ReturnType<typeof createClient> | null = null
      try {
        if (uploads.length) supabase = createClient()
      } catch {
        supabase = null
      }
      for (let i = 0; i < uploads.length; i++) {
        const t = tokens[i]
        setProgress(`Uploading documents (${i + 1} of ${uploads.length})…`)
        if (!t || !supabase) {
          failed.push(uploads[i].file.name)
          continue
        }
        try {
          const up = await supabase.storage
            .from('credit-applications')
            .uploadToSignedUrl(t.path, t.token, uploads[i].file, { contentType: uploads[i].file.type })
          if (up.error) failed.push(uploads[i].file.name)
        } catch {
          failed.push(uploads[i].file.name)
        }
      }

      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* ignore */
      }
      setDone({ reference: data.reference, failedUploads: failed })
      scrollTop()
    } catch {
      setSubmitError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
      setProgress('')
    }
  }

  const startOver = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    setApp(() => {
      const fresh = emptyApplication()
      const rep = params.get('rep')
      if (rep) fresh.salesRep = rep.slice(0, 100)
      return fresh
    })
    setUploads([])
    setErrors({})
    setStep(0)
  }

  if (done) {
    return (
      <div ref={topRef} className={`${CARD} mx-auto max-w-2xl text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-300">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="text-3xl font-bold text-white">Application submitted</h2>
        <p className="mt-3 text-white/80">
          Thank you. Your credit application for <strong className="text-white">{app.registeredName}</strong> has been
          received by our accounts team.
        </p>
        <div className="mx-auto mt-6 inline-block rounded-xl border border-white/20 bg-white/10 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Your reference</p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">{done.reference}</p>
        </div>
        {done.failedUploads.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/15 p-4 text-left text-sm text-amber-100">
            <p className="font-semibold">Some documents did not upload:</p>
            <ul className="mt-1 list-disc pl-5">
              {done.failedUploads.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-2">
              Please email them to{' '}
              <a className="underline" href={`mailto:kbc1@telkomsa.net?subject=${encodeURIComponent(done.reference)}`}>
                kbc1@telkomsa.net
              </a>{' '}
              with your reference in the subject line.
            </p>
          </div>
        )}
        <p className="mt-6 text-sm text-white/70">
          {app.buyerContact.email ? `A confirmation has been emailed to ${app.buyerContact.email}. ` : ''}
          Questions? Call 011 493 1336.
        </p>
        <Button asChild className="mt-6 bg-red-600 font-bold text-white hover:bg-red-700">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    )
  }

  const contactBlock = (
    key: 'buyerContact' | 'notificationsContact' | 'accountsContact',
    title: string,
    sub: string,
    required: boolean,
  ) => (
    <div className="rounded-xl border border-white/15 bg-white/5 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-white">
            {title}
            {!required && <span className="ml-2 text-xs font-normal text-white/60">(optional)</span>}
          </p>
          <p className="text-xs text-white/60">{sub}</p>
        </div>
        {key !== 'buyerContact' && (
          <button
            type="button"
            onClick={() => copyContact('buyerContact', key)}
            className="text-xs font-semibold text-white/80 underline hover:text-white"
          >
            Same as buyer
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact name" required={required} error={errors[`${key}.name`]}>
          <TextInput value={app[key].name} onChange={(v) => setContact(key, 'name', v)} error={errors[`${key}.name`]} autoComplete="name" />
        </Field>
        <Field label="Designation">
          <TextInput value={app[key].designation} onChange={(v) => setContact(key, 'designation', v)} placeholder="e.g. Procurement Manager" />
        </Field>
        <Field label="Email address" required={required} error={errors[`${key}.email`]}>
          <TextInput type="email" value={app[key].email} onChange={(v) => setContact(key, 'email', v)} error={errors[`${key}.email`]} autoComplete="email" />
        </Field>
        <Field label="Tel / cell number" required={required} error={errors[`${key}.phone`]}>
          <TextInput type="tel" value={app[key].phone} onChange={(v) => setContact(key, 'phone', v)} error={errors[`${key}.phone`]} autoComplete="tel" />
        </Field>
      </div>
    </div>
  )

  return (
    <div ref={topRef} className="mx-auto max-w-4xl scroll-mt-24">
      {/* Stepper */}
      <ol className="mb-8 grid grid-cols-5 gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="text-center">
            <div
              className={`mx-auto mb-2 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-red-500' : 'bg-white/20'}`}
            />
            <span className={`hidden text-xs font-semibold sm:block ${i === step ? 'text-white' : 'text-white/60'}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-4 text-sm font-semibold text-white sm:hidden">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <div className={CARD}>
        {/* Honeypot — hidden from people, tempting to bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          aria-hidden="true"
        />

        {step === 0 && (
          <div className="space-y-6">
            <SectionTitle sub="As registered with CIPC. Fields marked * are required.">Company details</SectionTitle>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Registered company name" required error={errors.registeredName} className="md:col-span-2">
                <TextInput value={app.registeredName} onChange={(v) => set('registeredName', v)} error={errors.registeredName} autoComplete="organization" />
              </Field>
              <Field label="Company trading name" className="md:col-span-2" hint="Leave blank if the same as the registered name">
                <TextInput value={app.tradingName} onChange={(v) => set('tradingName', v)} />
              </Field>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold text-white">
                Type of entity<span className="text-red-300"> *</span>
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-invalid={Boolean(errors.entityType)}>
                {ENTITY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={app.entityType === t}
                    onClick={() => set('entityType', t)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      app.entityType === t
                        ? 'border-red-400 bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'border-white/20 bg-white/5 text-white/85 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.entityType && <span className="mt-1 block text-xs font-medium text-red-300">{errors.entityType}</span>}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Company registration number"
                required={Boolean(app.entityType) && !['Sole Trader', 'Partnership'].includes(app.entityType)}
                error={errors.registrationNumber}
              >
                <TextInput value={app.registrationNumber} onChange={(v) => set('registrationNumber', v)} error={errors.registrationNumber} placeholder="e.g. 2015/123456/07" />
              </Field>
              <Field label="VAT registration number">
                <TextInput value={app.vatNumber} onChange={(v) => set('vatNumber', v)} inputMode="numeric" />
              </Field>
              <Field label="Physical address" required error={errors.physicalAddress} className="md:col-span-2">
                <textarea
                  rows={2}
                  value={app.physicalAddress}
                  onChange={(e) => set('physicalAddress', e.target.value)}
                  aria-invalid={Boolean(errors.physicalAddress)}
                  className={`${INPUT} ${errors.physicalAddress ? 'border-red-400' : 'border-white/20'}`}
                  autoComplete="street-address"
                />
              </Field>
              <Field label="Postal address" className="md:col-span-2">
                <textarea
                  rows={2}
                  value={app.postalAddress}
                  onChange={(e) => set('postalAddress', e.target.value)}
                  className={`${INPUT} border-white/20`}
                />
              </Field>
              <Field label="Telephone number" required error={errors.telephone}>
                <TextInput type="tel" value={app.telephone} onChange={(v) => set('telephone', v)} error={errors.telephone} />
              </Field>
              <Field label="Fax number">
                <TextInput type="tel" value={app.fax} onChange={(v) => set('fax', v)} />
              </Field>
              <Field label="Date company established">
                <TextInput type="date" value={app.dateEstablished} onChange={(v) => set('dateEstablished', v)} max={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Sales representative" hint="If a KBC rep assisted you">
                <TextInput value={app.salesRep} onChange={(v) => set('salesRep', v)} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <SectionTitle sub="Who we deal with for orders, promotions and statements.">Contact details</SectionTitle>
            {contactBlock('buyerContact', 'Buyer contact', 'Places orders with us', true)}
            {contactBlock('notificationsContact', 'Notifications & promotions', 'Receives specials and product news', false)}
            {contactBlock('accountsContact', 'Accounts department', 'Receives statements and invoices', true)}

            <SectionTitle>Banking details</SectionTitle>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Bank" required error={errors.bankName}>
                <TextInput value={app.bankName} onChange={(v) => set('bankName', v)} error={errors.bankName} list="sa-banks" />
                <datalist id="sa-banks">
                  {['ABSA', 'Capitec', 'FNB', 'Investec', 'Nedbank', 'Standard Bank', 'TymeBank', 'African Bank', 'Discovery Bank'].map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <Field label="Account name" required error={errors.bankAccountName}>
                <TextInput value={app.bankAccountName} onChange={(v) => set('bankAccountName', v)} error={errors.bankAccountName} />
              </Field>
              <Field label="Account number" required error={errors.bankAccountNumber}>
                <TextInput value={app.bankAccountNumber} onChange={(v) => set('bankAccountNumber', v)} error={errors.bankAccountNumber} inputMode="numeric" />
              </Field>
              <Field label="Branch code" required error={errors.bankBranchCode}>
                <TextInput value={app.bankBranchCode} onChange={(v) => set('bankBranchCode', v)} error={errors.bankBranchCode} inputMode="numeric" />
              </Field>
              <Field label="Branch location">
                <TextInput value={app.bankBranchLocation} onChange={(v) => set('bankBranchLocation', v)} />
              </Field>
              <Field label="Credit limit required (R)" required error={errors.creditLimit}>
                <TextInput value={app.creditLimit} onChange={(v) => set('creditLimit', v)} error={errors.creditLimit} inputMode="decimal" placeholder="e.g. 50000" />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <SectionTitle sub="List every owner, director, partner or member. Each one binds themselves as surety under the terms.">
              Directorship / owners
            </SectionTitle>
            {errors.directors && <p className="text-sm text-red-300">{errors.directors}</p>}
            {app.directors.map((d, i) => (
              <div key={i} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-bold text-white">Owner / director {i + 1}</p>
                  {app.directors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => set('directors', app.directors.filter((_, j) => j !== i))}
                      className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Full name" required error={errors[`directors.${i}.fullName`]}>
                    <TextInput value={d.fullName} onChange={(v) => setListItem('directors', i, 'fullName', v)} error={errors[`directors.${i}.fullName`]} />
                  </Field>
                  <Field label="ID number" required error={errors[`directors.${i}.idNumber`]}>
                    <TextInput value={d.idNumber} onChange={(v) => setListItem('directors', i, 'idNumber', v)} error={errors[`directors.${i}.idNumber`]} inputMode="numeric" />
                  </Field>
                  <Field label="Interest holding (%)" error={errors[`directors.${i}.interestHolding`]}>
                    <TextInput value={d.interestHolding} onChange={(v) => setListItem('directors', i, 'interestHolding', v)} error={errors[`directors.${i}.interestHolding`]} inputMode="decimal" />
                  </Field>
                  <Field label="Position">
                    <TextInput value={d.position} onChange={(v) => setListItem('directors', i, 'position', v)} placeholder="e.g. Director, Member, Owner" />
                  </Field>
                  <Field label="Residential address" required error={errors[`directors.${i}.residentialAddress`]} className="md:col-span-2">
                    <textarea
                      rows={2}
                      value={d.residentialAddress}
                      onChange={(e) => setListItem('directors', i, 'residentialAddress', e.target.value)}
                      aria-invalid={Boolean(errors[`directors.${i}.residentialAddress`])}
                      className={`${INPUT} ${errors[`directors.${i}.residentialAddress`] ? 'border-red-400' : 'border-white/20'}`}
                    />
                  </Field>
                </div>
              </div>
            ))}
            {app.directors.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => set('directors', [...app.directors, emptyDirector()])}
                className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-4 w-4" /> Add another owner / director
              </Button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <SectionTitle sub="Suppliers you currently buy from on credit. At least one is required.">Trade references</SectionTitle>
            {app.tradeReferences.map((r, i) => (
              <div key={i} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <p className="mb-4 font-bold text-white">
                  Reference {i + 1}
                  {i > 0 && <span className="ml-2 text-xs font-normal text-white/60">(optional)</span>}
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Company name" required={i === 0} error={errors[`tradeReferences.${i}.companyName`]}>
                    <TextInput value={r.companyName} onChange={(v) => setListItem('tradeReferences', i, 'companyName', v)} error={errors[`tradeReferences.${i}.companyName`]} />
                  </Field>
                  <Field label="Telephone number" required={i === 0} error={errors[`tradeReferences.${i}.telephone`]}>
                    <TextInput type="tel" value={r.telephone} onChange={(v) => setListItem('tradeReferences', i, 'telephone', v)} error={errors[`tradeReferences.${i}.telephone`]} />
                  </Field>
                  <Field label="Contact person" required={i === 0} error={errors[`tradeReferences.${i}.contactPerson`]}>
                    <TextInput value={r.contactPerson} onChange={(v) => setListItem('tradeReferences', i, 'contactPerson', v)} error={errors[`tradeReferences.${i}.contactPerson`]} />
                  </Field>
                  <Field label="Designation">
                    <TextInput value={r.designation} onChange={(v) => setListItem('tradeReferences', i, 'designation', v)} />
                  </Field>
                  <Field label="Est. monthly purchase (R)">
                    <TextInput value={r.estMonthlyPurchase} onChange={(v) => setListItem('tradeReferences', i, 'estMonthlyPurchase', v)} inputMode="decimal" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <SectionTitle sub="PDF or photo, up to 10 MB each. You can also email outstanding documents to kbc1@telkomsa.net later.">
                Supporting documents
              </SectionTitle>
              <div className="space-y-3">
                {DOCUMENT_KINDS.map((kind) => {
                  const files = uploads.filter((u) => u.kind === kind.id)
                  return (
                    <div
                      key={kind.id}
                      className={`rounded-xl border p-4 ${kind.required ? 'border-white/15 bg-white/5' : 'border-amber-300/25 bg-amber-400/5'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          {files.length ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-300" />
                          ) : (
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-white/50" />
                          )}
                          <span className="text-sm font-semibold text-white">
                            {kind.label}
                            {!kind.required && <span className="ml-1 font-normal text-amber-200/80">— optional</span>}
                          </span>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20">
                          <Upload className="h-4 w-4" /> {files.length ? 'Add more' : 'Upload'}
                          <input
                            type="file"
                            multiple
                            accept={ALLOWED_MIME.join(',')}
                            className="sr-only"
                            onChange={(e) => {
                              addFiles(kind.id, e.target.files)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                      {files.length > 0 && (
                        <ul className="mt-3 space-y-1.5 pl-7">
                          {files.map((u) => (
                            <li key={`${u.file.name}-${u.file.size}-${u.file.lastModified}`} className="flex items-center gap-2 text-sm text-white/85">
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{u.file.name}</span>
                              <span className="shrink-0 text-xs text-white/50">{(u.file.size / 1024 / 1024).toFixed(1)} MB</span>
                              <button
                                type="button"
                                aria-label={`Remove ${u.file.name}`}
                                onClick={() => setUploads((all) => all.filter((x) => x !== u))}
                                className="ml-auto text-white/60 hover:text-red-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
              {uploadError && <p className="mt-3 text-sm text-red-300">{uploadError}</p>}
              {missingRequiredDocs.length > 0 && (
                <p className="mt-3 text-xs text-white/65">
                  Still needed before your account can be opened: {missingRequiredDocs.map((d) => d.label.split(' (')[0]).join('; ')}.
                  You may submit now and send these later.
                </p>
              )}
            </div>

            <div>
              <SectionTitle sub="Please read these carefully. They form part of your credit agreement with West Point Trading 55 CC.">
                Terms and conditions
              </SectionTitle>
              <div className="max-h-80 overflow-y-auto rounded-xl border border-white/15 bg-[#000034]/40 p-5 text-sm leading-relaxed text-white/85">
                {CREDIT_TERMS.map((section, si) => (
                  <div key={si} className={si ? 'mt-5' : ''}>
                    {section.heading && (
                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-white">{section.heading}</p>
                    )}
                    {section.clauses.map((c, ci) => (
                      <p key={ci} className={`mb-2 text-sm leading-relaxed text-white/85 ${c.num.includes('.') ? 'pl-6' : ''}`}>
                        {c.num && <span className="mr-1.5 font-semibold text-white">{c.num}.</span>}
                        {c.text}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
              <a
                href="/documents/kbc-credit-application-form.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/75 underline hover:text-white"
              >
                <FileText className="h-4 w-4" /> Download the original form (PDF)
              </a>
            </div>

            <div>
              <SectionTitle>Terms of application</SectionTitle>
              <div className="space-y-2 text-sm text-white/85">
                {TERMS_OF_APPLICATION.map((p) => (
                  <p key={p} className="text-sm leading-relaxed text-white/85">{p}</p>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {(
                  [
                    ['acceptTerms', 'I have read and understood the terms and conditions above and agree to be bound by them, and I warrant that the information in this application is true and correct.'],
                    ['acceptSurety', 'I bind myself as surety and co-principal debtor for the obligations of the applicant to West Point Trading 55 CC, as set out in the Deed of Suretyship (clauses 32–38).'],
                    ['acceptCreditCheck', 'I consent to West Point Trading 55 CC and its agents contacting my trade references and credit bureaux to assess this application (clause 24).'],
                  ] as const
                ).map(([key, text]) => (
                  <label key={key} className="flex cursor-pointer items-start gap-3" aria-invalid={Boolean(errors[key])}>
                    <input
                      type="checkbox"
                      checked={app[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-red-600"
                    />
                    <span className="text-sm text-white">
                      {text}
                      {errors[key] && <span className="mt-0.5 block text-xs font-medium text-red-300">{errors[key]}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle sub="Authorised signatory: a director, partner, member or owner.">Authorised signature</SectionTitle>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field label="Full name" required error={errors.signatoryName}>
                  <TextInput value={app.signatoryName} onChange={(v) => set('signatoryName', v)} error={errors.signatoryName} autoComplete="name" />
                </Field>
                <Field label="Capacity" required error={errors.signatoryCapacity}>
                  <TextInput value={app.signatoryCapacity} onChange={(v) => set('signatoryCapacity', v)} error={errors.signatoryCapacity} placeholder="Director / Partner / Member / Owner" list="capacities" />
                  <datalist id="capacities">
                    {['Director', 'Partner', 'Member', 'Owner'].map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Date" required error={errors.signedDate}>
                  <TextInput type="date" value={app.signedDate} onChange={(v) => set('signedDate', v)} error={errors.signedDate} />
                </Field>
              </div>
              <div className="mt-5" aria-invalid={Boolean(errors.signature)}>
                <SignaturePad value={app.signature} onChange={(v) => set('signature', v)} invalid={Boolean(errors.signature)} />
                {errors.signature && <p className="mt-1 text-xs font-medium text-red-300">{errors.signature}</p>}
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-500/15 p-4 text-sm text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-6">
          <div className="flex items-center gap-4">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={back}
                disabled={submitting}
                className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <button type="button" onClick={startOver} className="text-sm text-white/60 underline hover:text-white">
                Clear form
              </button>
            )}
          </div>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} className="gap-2 bg-red-600 px-6 font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-700">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="gap-2 bg-red-600 px-6 font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? progress || 'Submitting…' : 'Submit application'}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-white/60">
        Your progress is saved on this device until you submit. Your information is handled in line with our{' '}
        <Link href="/privacy-policy" className="underline hover:text-white">
          privacy policy
        </Link>
        .
      </p>
    </div>
  )
}
