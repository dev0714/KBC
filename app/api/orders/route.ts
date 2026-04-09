import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

type OrderItem = {
  id: number
  sku: string
  name: string
  price: number
  qty: number
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('kbc_session')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    const businessId = payload.business_id as string | undefined

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in session' }, { status: 401 })
    }

    const body = await req.json()
    const items = Array.isArray(body.items) ? (body.items as OrderItem[]) : []
    const paymentMethod = body.paymentMethod === 'payfast' ? 'payfast' : 'credit'
    const total = Number(body.total)

    if (!items.length || !Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const orderNumber = `ORD-${Date.now()}`
    const orderDate = new Date().toISOString()
    const taxAmount = total * 0.15
    const paymentStatus = paymentMethod === 'payfast' ? 'Pending' : 'Paid'

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        client_account_no: businessId,
        order_date: orderDate,
        total_amount: total,
        total_tax_amount: taxAmount,
        payment_status: paymentStatus,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { error: 'Error inserting order', details: orderError.message, code: orderError.code },
        { status: 500 }
      )
    }

    const orderItems = items.map((item) => ({
      order_id: orderData.id,
      sku: item.sku,
      quantity: item.qty,
      price: item.price,
      tax: item.price * item.qty * 0.15,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      return NextResponse.json(
        { error: 'Error inserting order items', details: itemsError.message, code: itemsError.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderData.id,
        order_number: orderNumber,
        total,
        paymentStatus,
      },
    })
  } catch (error: any) {
    console.error('[v0] Create order API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
