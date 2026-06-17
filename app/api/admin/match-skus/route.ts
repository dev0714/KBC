import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// Given a list of numeric codes extracted from image filenames, returns the
// products that match each code. Matching follows the agreed rule:
//   - exact:    sku = code              (safe, auto-attach)
//   - contains: sku ILIKE '%code%'      (shown for manual confirmation)
// Anything with no rows is treated as a "future" product by the caller.
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { codes } = await request.json()
  if (!Array.isArray(codes)) {
    return NextResponse.json({ error: 'codes array is required' }, { status: 400 })
  }

  // De-duplicate the codes we actually look up.
  const unique = Array.from(new Set(codes.filter((c) => typeof c === 'string' && c.length > 0)))
  if (unique.length === 0) return NextResponse.json({ matches: {} })

  const supabase = createServiceClient()

  // One query: every product whose sku contains any of the codes.
  // Then we bucket the rows per code in JS (a code can match several skus).
  const orFilter = unique.map((c) => `sku.ilike.%${c}%`).join(',')
  const { data, error } = await supabase
    .from('products')
    .select('sku, title, product_type')
    .or(orFilter)

  if (error) {
    console.error('[match-skus] error:', error)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }

  const matches: Record<string, { exact: any | null; candidates: any[] }> = {}
  for (const code of unique) {
    const lc = code.toLowerCase()
    const rows = (data || []).filter((p) => String(p.sku).toLowerCase().includes(lc))
    const exact = rows.find((p) => String(p.sku).toLowerCase() === lc) || null
    matches[code] = { exact, candidates: rows }
  }

  return NextResponse.json({ matches })
}
