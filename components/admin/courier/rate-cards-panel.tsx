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
  'bg-white rounded-lg border border-[#E3E6EC]'
const LABEL = 'block text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-2'
const FIELD =
  'border-[#E3E6EC] bg-[#F8F9FB] text-[#121826] placeholder:text-[#8A919E] focus-visible:ring-blue-500/40 [color-scheme:dark]'

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
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-3">Logistics</p>
        <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight text-[#121826] sm:text-[28px] sm:leading-[34px]">Courier Rate Cards</h1>
        <p className="mt-3 max-w-2xl text-[#3D4452]">
          Fuel levies, minimums, effective dates and MJV area rates — changes apply to the next quote immediately.
        </p>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-lg border border-[#E3E6EC] bg-[#FFF4DB] p-5 text-sm text-[#7A4F00]">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Rate cards are not editable yet.</p>
            <p className="mt-1 text-[#7A4F00]">{loadError}</p>
            <p className="mt-1 text-[#7A4F00]">
              Quoting still works — it uses the rates bundled from the original spreadsheets until the database tables
              are set up.
            </p>
          </div>
        </div>
      )}

      {cards === null && !loadError && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#5A6272]" />
        </div>
      )}

      {cards?.map((card) => {
        const isSaving = saving === card.id
        return (
          <div key={card.id} className={`${PANEL} p-8 space-y-6`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-2">
                  {card.couriers?.rate_model === 'area_perkg' ? 'Per-kg rates' : 'Element grid'}
                </p>
                <h2 className="text-xl font-bold text-[#121826]">
                  {card.couriers?.name}
                  {card.service ? ` · ${card.service}` : ''}
                  {savedFlash === card.id && (
                    <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-transparent bg-[#E7F4EE] px-2.5 py-1 text-xs font-bold text-[#0B6B41]">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-[#5A6272]">
                {card.account_ref ?? ''}
                {card.cellCount ? ` · ${card.cellCount} rate cells` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4">
                <label className={LABEL}>Fuel levy</label>
                <Input
                  value={draft(`fuel:${card.id}`, String(card.fuel_levy))}
                  onChange={(e) => setDraft(`fuel:${card.id}`, e.target.value)}
                  className={FIELD}
                />
              </div>
              {card.minimum_charge !== null && (
                <div className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4">
                  <label className={LABEL}>Minimum (R)</label>
                  <Input
                    value={draft(`min:${card.id}`, String(card.minimum_charge))}
                    onChange={(e) => setDraft(`min:${card.id}`, e.target.value)}
                    className={FIELD}
                  />
                </div>
              )}
              <div className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4">
                <label className={LABEL}>Effective from</label>
                <Input
                  type="date"
                  value={draft(`from:${card.id}`, card.effective_from)}
                  onChange={(e) => setDraft(`from:${card.id}`, e.target.value)}
                  className={FIELD}
                />
              </div>
              <div className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4">
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
              className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save card
            </Button>

            {card.areaRates.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[#E3E6EC]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E3E6EC] bg-[#F8F9FB]">
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">Area</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">Rate / kg</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">TA / kg</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">TA over (kg)</th>
                      <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-[#5A6272] font-semibold">Base applied</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {card.areaRates.map((a) => (
                      <tr key={a.id} className="border-t border-[#E3E6EC] transition-colors hover:bg-white/[0.04]">
                        <td className="px-5 py-3 font-bold text-[#121826]">{a.area}</td>
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
                            className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] px-3 py-2 text-sm text-[#121826] [color-scheme:dark]"
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
                            className="border-[#E8A5A5] text-[#A4161A] hover:bg-[#F4F5F7] font-bold bg-transparent"
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
