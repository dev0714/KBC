'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, CheckCircle2, Save } from 'lucide-react'

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

const PANEL =
  'rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b2a5b]/90 to-[#07163f]/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl'
const LABEL = 'block text-[11px] uppercase tracking-[0.28em] text-slate-400 mb-2'
const FIELD =
  'border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/40 [color-scheme:dark]'

export function RateCardsPanel() {
  const [cards, setCards] = useState<RateCard[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [savedFlash, setSavedFlash] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

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
    load()
  }, [load])

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

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400 mb-3">Logistics</p>
        <h1 className="text-4xl font-black tracking-tight text-white">Courier Rate Cards</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Fuel levies, minimums, effective dates and MJV area rates — changes apply to the next quote immediately.
        </p>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Rate cards are not editable yet.</p>
            <p className="mt-1 text-amber-300/80">{loadError}</p>
            <p className="mt-1 text-amber-300/80">
              Quoting still works — it uses the rates bundled from the original spreadsheets until the database tables
              are set up.
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
          <div key={card.id} className={`${PANEL} p-8 space-y-6`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-2">
                  {card.couriers?.rate_model === 'area_perkg' ? 'Per-kg rates' : 'Element grid'}
                </p>
                <h2 className="text-xl font-bold text-white">
                  {card.couriers?.name}
                  {card.service ? ` · ${card.service}` : ''}
                  {savedFlash === card.id && (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                {card.account_ref ?? ''}
                {card.cellCount ? ` · ${card.cellCount} rate cells` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className={LABEL}>Fuel levy</label>
                <Input
                  value={draft(`fuel:${card.id}`, String(card.fuel_levy))}
                  onChange={(e) => setDraft(`fuel:${card.id}`, e.target.value)}
                  className={FIELD}
                />
              </div>
              {card.minimum_charge !== null && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className={LABEL}>Minimum (R)</label>
                  <Input
                    value={draft(`min:${card.id}`, String(card.minimum_charge))}
                    onChange={(e) => setDraft(`min:${card.id}`, e.target.value)}
                    className={FIELD}
                  />
                </div>
              )}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className={LABEL}>Effective from</label>
                <Input
                  type="date"
                  value={draft(`from:${card.id}`, card.effective_from)}
                  onChange={(e) => setDraft(`from:${card.id}`, e.target.value)}
                  className={FIELD}
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className={LABEL}>Expires</label>
                <Input
                  type="date"
                  value={draft(`to:${card.id}`, card.effective_to ?? '')}
                  onChange={(e) => setDraft(`to:${card.id}`, e.target.value)}
                  className={FIELD}
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
              className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold gap-2 shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-red-600"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save card
            </Button>

            {card.areaRates.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Area</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Rate / kg</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">TA / kg</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">TA over (kg)</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Base applied</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {card.areaRates.map((a) => (
                      <tr key={a.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.04]">
                        <td className="px-5 py-3 font-bold text-white">{a.area}</td>
                        {(['rate_per_kg', 'ta_per_kg', 'ta_threshold_kg'] as const).map((f) => (
                          <td key={f} className="px-5 py-3">
                            <Input
                              value={draft(`${f}:${a.id}`, String(a[f]))}
                              onChange={(e) => setDraft(`${f}:${a.id}`, e.target.value)}
                              className={`w-24 ${FIELD}`}
                            />
                          </td>
                        ))}
                        <td className="px-5 py-3">
                          <select
                            value={draft(`mode:${a.id}`, a.base_mode)}
                            onChange={(e) => setDraft(`mode:${a.id}`, e.target.value)}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]"
                          >
                            <option value="flat_once">Once per shipment (as spreadsheet)</option>
                            <option value="per_kg">Multiplied by weight</option>
                          </select>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving === a.id}
                            className="border-red-500/50 text-red-300 hover:bg-red-500/10 font-bold bg-transparent"
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
  )
}
