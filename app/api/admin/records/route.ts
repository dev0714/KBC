import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// Admin writes that used to run in the browser with the anon key. RLS blocks
// those (the app does not use Supabase Auth), so they failed silently. Each
// table has an explicit key column and field whitelist.
const TABLES = {
  products: {
    key: 'sku',
    fields: ['sku', 'title', 'product_type', 'description', 'price', 'inventory_quantity', 'dimensions', 'note'],
    actions: ['insert', 'update', 'delete'],
  },
  orders: { key: 'order_number', fields: ['payment_status'], actions: ['update'] },
  clients: { key: 'account_no', fields: ['client_name', 'address'], actions: ['update'] },
} as const

type Table = keyof typeof TABLES

function pick(table: Table, values: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const f of TABLES[table].fields) {
    if (values[f] === undefined) continue
    let v = values[f]
    if (f === 'price') v = v === '' || v === null ? null : Number(v)
    if (f === 'inventory_quantity') v = v === '' || v === null ? 0 : Math.trunc(Number(v))
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`${f} must be a number`)
    if (typeof v === 'string') v = v.trim()
    out[f] = v
  }
  return out
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const table = body?.table as Table
  const action = body?.action as string
  if (!(table in TABLES) || !(TABLES[table].actions as readonly string[]).includes(action)) {
    return NextResponse.json({ error: 'Unsupported change' }, { status: 400 })
  }

  let values: Record<string, unknown>
  try {
    values = pick(table, body.values ?? {})
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid values' }, { status: 400 })
  }

  const db = createServiceClient()
  const keyCol = TABLES[table].key
  const key = body.key

  if (action === 'insert') {
    if (!values.sku || !values.title) {
      return NextResponse.json({ error: 'SKU and product name are required' }, { status: 400 })
    }
    const { data, error } = await db.from(table).insert(values).select().single()
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'That SKU already exists' : error.message }, { status: 400 })
    return NextResponse.json({ record: data })
  }

  if (typeof key !== 'string' || !key) return NextResponse.json({ error: 'Missing record key' }, { status: 400 })

  if (action === 'delete') {
    const { data, error } = await db.from(table).delete().eq(keyCol, key).select(keyCol)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data?.length) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  }

  if (!Object.keys(values).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  const { data, error } = await db.from(table).update(values).eq(keyCol, key).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  return NextResponse.json({ record: data })
}
