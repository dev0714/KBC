'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Extracts the matching number from an image filename.
 *  - strips the extension                     (D3106E.jpg  -> D3106E)
 *  - strips a trailing image index like -1/-2 (HRBYB025-1  -> HRBYB025)
 *  - returns the longest run of digits        (HRBYB025    -> 025)
 * Returns '' when the filename has no digits (e.g. HRBFUSOCK) -> treated as future.
 */
export function extractNumber(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  const noIndex = base.replace(/-\d+$/, '')
  const runs = noIndex.match(/\d+/g) || []
  if (runs.length === 0) return ''
  return runs.sort((a, b) => b.length - a.length || noIndex.lastIndexOf(b) - noIndex.lastIndexOf(a))[0] ?? ''
}

interface Candidate {
  sku: string
  title: string
  product_type: string
}

interface Row {
  file: File
  filename: string
  number: string
  candidates: Candidate[]
  exact: Candidate | null
  selectedSku: string // '' means skip (future)
}

type Phase = 'idle' | 'matching' | 'ready' | 'uploading' | 'done'

export default function BulkImagesPage() {
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'denied'>('checking')
  const [rows, setRows] = useState<Row[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [summary, setSummary] = useState<{ uploaded: number; skipped: number; failed: string[] } | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthState(data?.user?.role === 'admin' || data?.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => setAuthState('denied'))
  }, [])

  const runMatch = useCallback(async (draftRows: Row[]) => {
    setPhase('matching')
    const codes = Array.from(new Set(draftRows.map((r) => r.number).filter(Boolean)))
    let matches: Record<string, { exact: Candidate | null; candidates: Candidate[] }> = {}
    if (codes.length > 0) {
      try {
        const res = await fetch('/api/admin/match-skus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes }),
        })
        if (res.ok) matches = (await res.json()).matches || {}
      } catch (err) {
        console.error('[bulk-images] match error:', err)
      }
    }

    setRows(
      draftRows.map((r) => {
        const m = matches[r.number] || { exact: null, candidates: [] }
        // Auto-select an exact match, or the only candidate; otherwise leave blank
        // so the user explicitly chooses (or it stays skipped as future stock).
        const selectedSku =
          m.exact?.sku || (m.candidates.length === 1 ? m.candidates[0].sku : '')
        return { ...r, candidates: m.candidates, exact: m.exact, selectedSku }
      }),
    )
    setPhase('ready')
  }, [])

  const handleSelectFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setSummary(null)
    const draft: Row[] = Array.from(fileList).map((file) => ({
      file,
      filename: file.name,
      number: extractNumber(file.name),
      candidates: [],
      exact: null,
      selectedSku: '',
    }))
    setRows(draft)
    await runMatch(draft)
  }

  const updateNumber = (index: number, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, number: value } : r)))
  }

  const updateSelection = (index: number, sku: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, selectedSku: sku } : r)))
  }

  const handleUpload = async () => {
    const toUpload = rows.filter((r) => r.selectedSku)
    if (toUpload.length === 0) return

    setPhase('uploading')
    setProgress({ current: 0, total: toUpload.length })
    const supabase = createClient()

    // Determine which target SKUs already have a primary image so we don't
    // create a second one. The first new image for a SKU with no primary
    // becomes primary.
    const targetSkus = Array.from(new Set(toUpload.map((r) => r.selectedSku)))
    const existingPrimary = new Set<string>()
    try {
      const res = await fetch(`/api/admin/product-images?skus=${encodeURIComponent(targetSkus.join(','))}`)
      if (res.ok) {
        const { images } = await res.json()
        ;(images || []).forEach((img: any) => existingPrimary.add(img.product_sku))
      }
    } catch {
      // If this fails, fall back to marking the first per SKU as primary.
    }

    const rowsBySku: Record<string, Row[]> = {}
    for (const r of toUpload) (rowsBySku[r.selectedSku] ||= []).push(r)

    const failed: string[] = []
    let uploaded = 0
    let processed = 0

    for (const [sku, skuRows] of Object.entries(rowsBySku)) {
      let primaryAssigned = existingPrimary.has(sku)
      const imageRecords: any[] = []

      for (let i = 0; i < skuRows.length; i++) {
        const row = skuRows[i]
        try {
          const filePath = `${sku}/${Date.now()}_${i}_${row.filename}`
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, row.file, { upsert: true })
          if (uploadError) throw uploadError

          const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
          const isPrimary = !primaryAssigned
          if (isPrimary) primaryAssigned = true

          imageRecords.push({
            product_sku: sku,
            file_name: row.filename,
            storage_path: data.publicUrl,
            is_primary: isPrimary,
            sort_order: i,
            alt_text: sku,
          })
          uploaded++
        } catch (err) {
          console.error('[bulk-images] upload failed:', row.filename, err)
          failed.push(row.filename)
        }
        processed++
        setProgress({ current: processed, total: toUpload.length })
      }

      if (imageRecords.length > 0) {
        try {
          const res = await fetch('/api/admin/product-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: imageRecords }),
          })
          if (!res.ok) throw new Error(await res.text())
        } catch (err) {
          console.error('[bulk-images] record insert failed for sku', sku, err)
          imageRecords.forEach((rec) => failed.push(rec.file_name))
          uploaded -= imageRecords.length
        }
      }
    }

    setSummary({ uploaded, skipped: rows.length - toUpload.length, failed })
    setPhase('done')
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001b3d] text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (authState === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#001b3d] text-white">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p>Admin access required.</p>
        <a href="/login" className="underline">Go to login</a>
      </div>
    )
  }

  const matchedCount = rows.filter((r) => r.selectedSku).length
  const futureCount = rows.length - matchedCount

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <a href="/admin" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to admin
        </a>
        <h1 className="text-2xl font-bold mb-2">Bulk Image Import</h1>
        <p className="text-blue-200 mb-6 text-sm max-w-2xl">
          Select product images. The number in each filename is matched to a product SKU
          (exact match auto-selected). Unmatched files are skipped as future stock. Review the
          matches below before uploading. The first image per product becomes the primary image.
        </p>

        <label className="inline-flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-3 mb-6">
          <Upload className="w-4 h-4" />
          <span>Select images</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleSelectFiles(e.target.files)}
          />
        </label>

        {phase === 'matching' && (
          <p className="flex items-center gap-2 text-blue-200"><Loader2 className="w-4 h-4 animate-spin" /> Matching {rows.length} files…</p>
        )}

        {rows.length > 0 && phase !== 'matching' && (
          <>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <span className="px-3 py-1 rounded bg-green-500/20 border border-green-500/40">Matched: {matchedCount}</span>
              <span className="px-3 py-1 rounded bg-yellow-500/20 border border-yellow-500/40">Future (skipped): {futureCount}</span>
              <span className="px-3 py-1 rounded bg-white/10 border border-white/20">Total: {rows.length}</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-white/10 text-left">
                  <tr>
                    <th className="p-3">Filename</th>
                    <th className="p-3">Number</th>
                    <th className="p-3">Match → SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="p-3 font-mono text-xs">{row.filename}</td>
                      <td className="p-3 w-32">
                        <Input
                          value={row.number}
                          onChange={(e) => updateNumber(i, e.target.value)}
                          className="h-8 bg-white/10 border-white/20 text-white"
                        />
                      </td>
                      <td className="p-3">
                        {row.candidates.length === 0 ? (
                          <span className="text-yellow-300">no match — future</span>
                        ) : (
                          <select
                            value={row.selectedSku}
                            onChange={(e) => updateSelection(i, e.target.value)}
                            className="h-8 bg-[#002463] border border-white/20 rounded px-2 text-white max-w-xs"
                          >
                            <option value="">— skip (future) —</option>
                            {row.candidates.map((c) => (
                              <option key={c.sku} value={c.sku}>
                                {c.sku === row.exact?.sku ? '★ ' : ''}{c.sku} ({c.product_type})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => runMatch(rows)}
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
                disabled={phase === 'uploading'}
              >
                Re-match
              </Button>
              <Button
                onClick={handleUpload}
                disabled={matchedCount === 0 || phase === 'uploading'}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {phase === 'uploading' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading {progress.current}/{progress.total}…</>
                ) : (
                  <>Upload {matchedCount} image{matchedCount === 1 ? '' : 's'}</>
                )}
              </Button>
            </div>
          </>
        )}

        {summary && (
          <div className="mt-6 p-4 rounded-lg bg-white/10 border border-white/20">
            <p className="flex items-center gap-2 font-semibold mb-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> Import complete</p>
            <ul className="text-sm space-y-1 text-blue-100">
              <li>Uploaded & mapped: {summary.uploaded}</li>
              <li>Skipped (future stock): {summary.skipped}</li>
              <li>Failed: {summary.failed.length}{summary.failed.length > 0 ? ` — ${summary.failed.join(', ')}` : ''}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
