'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react'

interface AreaRate {
  id: number
  area: string
  rate_per_kg: number
  ta_per_kg: number
  ta_threshold_kg: number
  base_mode: 'flat_once' | 'per_kg'
}

interface RateCard {
  id: number
  service: string | null
  account_ref: string | null
  fuel_levy: number
  minimum_charge: number | null
  effective_from: string
  effective_to: string | null
  cellCount: number
  areaRates: AreaRate[]
  couriers: { id: number; name: string; rate_model: string } | null
}

export default function RateCardsPage() {
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'denied'>('checking')
  const [cards, setCards] = useState<RateCard[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [savedFlash, setSavedFlash] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthState(data?.user?.role === 'admin' || data?.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => setAuthState('denied'))
  }, [])

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const res = await fetch('/api/admin/rate-cards')
      const data = await res.json()
      if (!res.ok) {
        setLoadError(data.error ?? 'Failed to load rate cards')
        setCards([])
      } else {
        setCards(data.cards)
      }
    } catch {
      setLoadError('Network error loading rate cards')
      setCards([])
    }
  }, [])

  useEffect(() => {
    if (authState === 'ok') load()
  }, [authState, load])

  const draft = (key: string, fallback: string) => drafts[key] ?? fallback
  const setDraft = (key: string, value: string) => setDrafts((d) => ({ ...d, [key]: value }))

  const patch = async (id: number, body: Record<string, unknown>) => {
    setSaving(id)
    try {
      const res = await fetch('/api/admin/rate-cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSavedFlash(id)
        setTimeout(() => setSavedFlash(null), 1500)
        await load()
      } else {
        const data = await res.json()
        setLoadError(data.error ?? 'Save failed')
      }
    } finally {
      setSaving(null)
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
            Courier Rate Cards
          </h1>
        </div>

        {loadError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Rate cards are not editable yet.</p>
              <p className="mt-1 text-amber-300/80">{loadError}</p>
              <p className="mt-1 text-amber-300/80">
                Quoting still works — it uses the rates bundled from the original spreadsheets until the database
                tables are set up.
              </p>
            </div>
          </div>
        )}

        {cards === null && !loadError && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {cards?.map((card) => {
          const isSaving = saving === card.id
          return (
            <div
              key={card.id}
              className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl p-6 space-y-4 shadow-xl shadow-primary/10"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">
                  {card.couriers?.name}
                  {card.service ? ` · ${card.service}` : ''}
                  {savedFlash === card.id && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  {card.account_ref ?? ''}
                  {card.cellCount ? ` · ${card.cellCount} rate cells` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="block text-slate-400 mb-1">Fuel levy</label>
                  <Input
                    value={draft(`fuel:${card.id}`, String(card.fuel_levy))}
                    onChange={(e) => setDraft(`fuel:${card.id}`, e.target.value)}
                    className="bg-slate-800/50 border-slate-600/50"
                  />
                </div>
                {card.minimum_charge !== null && (
                  <div>
                    <label className="block text-slate-400 mb-1">Minimum (R)</label>
                    <Input
                      value={draft(`min:${card.id}`, String(card.minimum_charge))}
                      onChange={(e) => setDraft(`min:${card.id}`, e.target.value)}
                      className="bg-slate-800/50 border-slate-600/50"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 mb-1">Effective from</label>
                  <Input
                    type="date"
                    value={draft(`from:${card.id}`, card.effective_from)}
                    onChange={(e) => setDraft(`from:${card.id}`, e.target.value)}
                    className="bg-slate-800/50 border-slate-600/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expires</label>
                  <Input
                    type="date"
                    value={draft(`to:${card.id}`, card.effective_to ?? '')}
                    onChange={(e) => setDraft(`to:${card.id}`, e.target.value)}
                    className="bg-slate-800/50 border-slate-600/50"
                  />
                </div>
              </div>

              <Button
                disabled={isSaving}
                onClick={() =>
                  patch(card.id, {
                    cardId: card.id,
                    fuelLevy: Number(draft(`fuel:${card.id}`, String(card.fuel_levy))),
                    ...(card.minimum_charge !== null && {
                      minimumCharge: Number(draft(`min:${card.id}`, String(card.minimum_charge))),
                    }),
                    effectiveFrom: draft(`from:${card.id}`, card.effective_from),
                    effectiveTo: draft(`to:${card.id}`, card.effective_to ?? '') || null,
                  })
                }
                variant="outline"
                className="border-primary/40 gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save card
              </Button>

              {card.areaRates.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-primary/20 to-secondary/20">
                      <tr>
                        <th className="text-left px-4 py-2">Area</th>
                        <th className="text-left px-4 py-2">Rate / kg</th>
                        <th className="text-left px-4 py-2">TA / kg</th>
                        <th className="text-left px-4 py-2">TA over (kg)</th>
                        <th className="text-left px-4 py-2">Base applied</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {card.areaRates.map((a) => (
                        <tr key={a.id} className="border-t border-white/5">
                          <td className="px-4 py-2 font-semibold">{a.area}</td>
                          {(['rate_per_kg', 'ta_per_kg', 'ta_threshold_kg'] as const).map((f) => (
                            <td key={f} className="px-4 py-2">
                              <Input
                                value={draft(`${f}:${a.id}`, String(a[f]))}
                                onChange={(e) => setDraft(`${f}:${a.id}`, e.target.value)}
                                className="w-24 bg-slate-800/50 border-slate-600/50"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2">
                            <select
                              value={draft(`mode:${a.id}`, a.base_mode)}
                              onChange={(e) => setDraft(`mode:${a.id}`, e.target.value)}
                              className="rounded-md bg-slate-800/50 border border-slate-600/50 px-2 py-1.5 text-sm"
                            >
                              <option value="flat_once">Once per shipment (as spreadsheet)</option>
                              <option value="per_kg">Multiplied by weight</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving === a.id}
                              className="border-primary/40"
                              onClick={() =>
                                patch(a.id, {
                                  areaRateId: a.id,
                                  ratePerKg: Number(draft(`rate_per_kg:${a.id}`, String(a.rate_per_kg))),
                                  taPerKg: Number(draft(`ta_per_kg:${a.id}`, String(a.ta_per_kg))),
                                  taThresholdKg: Number(draft(`ta_threshold_kg:${a.id}`, String(a.ta_threshold_kg))),
                                  baseMode: draft(`mode:${a.id}`, a.base_mode) as 'flat_once' | 'per_kg',
                                })
                              }
                            >
                              {saving === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
