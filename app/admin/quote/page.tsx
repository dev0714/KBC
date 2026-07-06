'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Truck, AlertCircle, CheckCircle2 } from 'lucide-react'

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
}

const rand = (n: number) => `R ${n.toFixed(2)}`

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
      <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
      <Input
        value={value}
        placeholder={placeholder}
        className="bg-slate-800/50 border-slate-600/50"
        onChange={(e) => {
          onChange(e.target.value)
          search(e.target.value)
        }}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-600/50 bg-slate-900 shadow-xl">
          {suggestions.map((s) => (
            <li key={`${s.source}:${s.name}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700/60"
                onMouseDown={() => {
                  onChange(s.name)
                  setOpen(false)
                }}
              >
                {s.name}
                <span className="ml-2 text-xs text-slate-500">{s.source}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function QuotePage() {
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'denied'>('checking')
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

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthState(data?.user?.role === 'admin' || data?.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => setAuthState('denied'))
  }, [])

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

  const cheapest = result?.comparison?.cheapest

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Courier Quote
          </h1>
        </div>

        <form
          onSubmit={submit}
          className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl p-6 space-y-4 shadow-xl shadow-primary/10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <TownInput label="Origin" value={origin} onChange={setOrigin} placeholder="e.g. Johannesburg" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Origin postcode</label>
              <Input
                value={originPostcode}
                onChange={(e) => setOriginPostcode(e.target.value)}
                placeholder="optional"
                className="bg-slate-800/50 border-slate-600/50"
              />
            </div>
            <div className="sm:col-span-2">
              <TownInput label="Destination" value={destination} onChange={setDestination} placeholder="e.g. Durban" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Destination postcode</label>
              <Input
                value={destPostcode}
                onChange={(e) => setDestPostcode(e.target.value)}
                placeholder="optional"
                className="bg-slate-800/50 border-slate-600/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Service</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-600/50">
                {(['Economy', 'Express'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setService(s)}
                    className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
                      service === s ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Weight (kg)</label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 757"
                inputMode="decimal"
                className="bg-slate-800/50 border-slate-600/50"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSplit}
                onChange={(e) => setAllowSplit(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              Optimise DSV parcel split
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || !origin.trim() || !destination.trim() || !(Number(weight) > 0)}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            {loading ? 'Quoting…' : 'Get Quote'}
          </Button>

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
        </form>

        {result && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl p-6 shadow-xl shadow-primary/10">
              <h2 className="text-lg font-bold mb-3">Route</h2>
              {result.route.ok ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Element</p>
                    <p className="text-2xl font-bold">{result.route.element}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Lead time</p>
                    <p className="font-semibold">{result.route.sla ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Scope</p>
                    <p className="font-semibold">{result.route.blns === 'LOC' ? 'Domestic' : result.route.blns}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Service</p>
                    <p className="font-semibold">{service}</p>
                  </div>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4" /> {result.route.error}
                  {result.route.sla ? ` (lead time still resolved: ${result.route.sla})` : ''}
                </p>
              )}
            </div>

            {result.quotes.length > 0 && (
              <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
                    <tr>
                      <th className="text-left px-5 py-3">Carrier</th>
                      <th className="text-left px-5 py-3">Detail</th>
                      <th className="text-right px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.quotes.map((q) => (
                      <tr key={q.carrier} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3 font-semibold">
                          {q.carrier}
                          {cheapest === q.carrier && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Cheapest
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {q.parcels && q.parcels.length > 1
                            ? `${q.parcels.length} parcels (${q.parcels.map((p) => `${p}kg`).join(' + ')})`
                            : Object.entries(q.breakdown)
                                .filter(([k]) => ['band', 'area', 'element'].includes(k))
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ') || '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums">{rand(q.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.comparison && result.comparison.quotes.length > 1 && (
                  <div className="px-5 py-4 bg-emerald-500/10 border-t border-emerald-500/20 text-sm font-semibold text-emerald-300">
                    Cheapest: {result.comparison.cheapest} — saves {rand(result.comparison.difference)}
                  </div>
                )}
              </div>
            )}

            {result.warnings.length > 0 && (
              <ul className="space-y-1">
                {result.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-amber-400/90">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
