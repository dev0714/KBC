'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Truck, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TownSuggestion {
  name: string
  source: string
}

interface CarrierQuote {
  carrier: string
  total: number
  breakdown: Record<string, number | string>
  parcels?: number[]
}

interface QuoteResponse {
  route: {
    ok: boolean
    error?: string
    element?: number
    sla?: string
    blns?: string
  }
  quotes: CarrierQuote[]
  comparison: { quotes: CarrierQuote[]; cheapest: string; difference: number } | null
  warnings: string[]
  suggestions?: { origin?: string[]; destination?: string[] }
}

const rand = (n: number) => `R ${n.toFixed(2)}`

const PANEL =
  'bg-white rounded-lg border border-[#E3E6EC]'
const LABEL = 'block text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-2'
const FIELD =
  'border-[#E3E6EC] bg-[#F8F9FB] text-[#121826] placeholder:text-[#8A919E] focus-visible:ring-blue-500/40'

function TownInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [suggestions, setSuggestions] = useState<TownSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      if (q.trim().length < 2) {
        setSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/admin/towns/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.towns ?? [])
          setOpen(true)
        }
      } catch {
        /* suggestions are best-effort */
      }
    }, 200)
  }, [])

  return (
    <div className="relative">
      <label className={LABEL}>{label}</label>
      <Input
        value={value}
        placeholder={placeholder}
        className={FIELD}
        onChange={(e) => {
          onChange(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-lg border border-[#E3E6EC] bg-white">
          {suggestions.map((s) => (
            <li key={`${s.source}:${s.name}`}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-[#121826] transition-colors hover:bg-[#F4F5F7]"
                onMouseDown={() => {
                  onChange(s.name)
                  setOpen(false)
                }}
              >
                {s.name}
                <span className="ml-2 text-[10px] uppercase tracking-wider text-[#5A6272]">{s.source}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CourierQuotePanel() {
  const [origin, setOrigin] = useState('')
  const [originPostcode, setOriginPostcode] = useState('')
  const [destination, setDestination] = useState('')
  const [destPostcode, setDestPostcode] = useState('')
  const [service, setService] = useState<'Economy' | 'Express'>('Economy')
  const [weight, setWeight] = useState('')
  const [allowSplit, setAllowSplit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<QuoteResponse | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/admin/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          originPostcode,
          destination,
          destPostcode,
          service,
          weightKg: Number(weight),
          allowSplit,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Quote failed')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  const cheapest = result?.comparison?.cheapest

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-3">Logistics</p>
        <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight text-[#121826] sm:text-[28px] sm:leading-[34px]">Courier Quote</h1>
        <p className="mt-3 max-w-2xl text-[#3D4452]">
          Compare MJV and DSV for a shipment and get the cheapest option with its delivery promise.
        </p>
      </div>

      <form onSubmit={submit} className={`${PANEL} p-8 space-y-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <TownInput label="Origin" value={origin} onChange={setOrigin} placeholder="e.g. Johannesburg" />
          </div>
          <div>
            <label className={LABEL}>Origin postcode</label>
            <Input
              value={originPostcode}
              onChange={(e) => setOriginPostcode(e.target.value)}
              placeholder="optional"
              className={FIELD}
            />
          </div>
          <div className="sm:col-span-2">
            <TownInput label="Destination" value={destination} onChange={setDestination} placeholder="e.g. Durban" />
          </div>
          <div>
            <label className={LABEL}>Destination postcode</label>
            <Input
              value={destPostcode}
              onChange={(e) => setDestPostcode(e.target.value)}
              placeholder="optional"
              className={FIELD}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
          <div>
            <label className={LABEL}>Service</label>
            <div className="flex rounded-lg overflow-hidden border border-[#E3E6EC]">
              {(['Economy', 'Express'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setService(s)}
                  className={`flex-1 px-3 py-2 text-sm font-bold transition-all ${
                    service === s
                      ? 'bg-[#0F1B3D] hover:bg-[#1E2C57] text-white'
                      : 'bg-[#F8F9FB] text-[#3D4452] hover:bg-[#F4F5F7]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Weight (kg)</label>
            <Input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 757"
              inputMode="decimal"
              className={FIELD}
            />
          </div>
          <label className="flex items-center gap-3 pb-2 cursor-pointer text-sm text-[#3D4452]">
            <input
              type="checkbox"
              checked={allowSplit}
              onChange={(e) => setAllowSplit(e.target.checked)}
              className="accent-red-600 w-4 h-4"
            />
            Optimise DSV parcel split
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading || !origin.trim() || !destination.trim() || !(Number(weight) > 0)}
          className="bg-[#C8102E] hover:bg-[#A50D26] w-full text-white font-bold gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
          {loading ? 'Quoting…' : 'Get Quote'}
        </Button>

        {error && (
          <p className="flex items-center gap-2 text-sm text-[#A4161A]">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
      </form>

      {result && (
        <div className="space-y-6">
          <div className={`${PANEL} p-8`}>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-2">Route</p>
            {result.route.ok ? (
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Element', value: String(result.route.element) },
                  { label: 'Lead time', value: result.route.sla ?? '—' },
                  { label: 'Scope', value: result.route.blns === 'LOC' ? 'Domestic' : result.route.blns ?? '—' },
                  { label: 'Service', value: service },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272]">{stat.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-[#121826]">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-[#7A4F00] text-sm">
                  <AlertCircle className="w-4 h-4" /> {result.route.error}
                  {result.route.sla ? ` (lead time still resolved: ${result.route.sla})` : ''}
                </p>
                {(['origin', 'destination'] as const).map((field) => {
                  const names = result.suggestions?.[field]
                  if (!names?.length) return null
                  return (
                    <p key={field} className="text-sm text-[#3D4452]">
                      Did you mean ({field}):{' '}
                      {names.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="mr-2 rounded-full border border-transparent bg-[#E6EAF3] px-3 py-1 text-[#0F1B3D] transition-colors hover:bg-[#F4F5F7]"
                          onClick={() => (field === 'origin' ? setOrigin(n) : setDestination(n))}
                        >
                          {n}
                        </button>
                      ))}
                    </p>
                  )
                })}
              </div>
            )}
          </div>

          {result.quotes.length > 0 && (
            <div className={`${PANEL} overflow-hidden`}>
              <div className="px-8 pt-8 pb-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-2">Comparison</p>
                <h2 className="text-xl font-bold text-[#121826]">Carrier Prices</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-[#E3E6EC] bg-[#F8F9FB]">
                    <th className="text-left px-8 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">Carrier</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">Detail</th>
                    <th className="text-right px-8 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.quotes.map((q) => (
                    <tr key={q.carrier} className="border-b border-[#E3E6EC] last:border-0 transition-colors hover:bg-white/[0.04]">
                      <td className="px-8 py-4 font-bold text-[#121826]">
                        {q.carrier}
                        {cheapest === q.carrier && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-transparent bg-[#E7F4EE] px-2.5 py-1 text-xs font-bold text-[#0B6B41]">
                            <CheckCircle2 className="w-3 h-3" /> Cheapest
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#5A6272]">
                        {q.parcels && q.parcels.length > 1
                          ? `${q.parcels.length} parcels (${q.parcels.map((p) => `${p}kg`).join(' + ')})`
                          : Object.entries(q.breakdown)
                              .filter(([k]) => ['band', 'area', 'element'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ') || '—'}
                      </td>
                      <td className="px-8 py-4 text-right font-semibold text-[#121826] tabular-nums">{rand(q.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.comparison && result.comparison.quotes.length > 1 && (
                <div className="px-8 py-4 border-t border-[#E3E6EC] bg-[#E7F4EE] text-sm font-bold text-[#0B6B41]">
                  Cheapest: {result.comparison.cheapest} — saves {rand(result.comparison.difference)}
                </div>
              )}
            </div>
          )}

          {result.warnings.length > 0 && (
            <ul className="space-y-2">
              {result.warnings.map((w) => (
                <li
                  key={w}
                  className="flex items-start gap-2 rounded-lg border border-[#E3E6EC] bg-[#FFF4DB] px-4 py-3 text-sm text-[#7A4F00]"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
