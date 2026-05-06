import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pf_payment_status, m_payment_id, custom_str1, order_id, order_number } = body

    if (!m_payment_id && !custom_str1 && !order_id && !order_number) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment reference' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const paymentReference = m_payment_id ? String(m_payment_id) : ''
    const orderReference = custom_str1 ? String(custom_str1) : ''
    const explicitOrderId = order_id && /^\d+$/.test(String(order_id)) ? Number.parseInt(String(order_id), 10) : null
    const explicitOrderNumber = order_number ? String(order_number) : (orderReference && String(orderReference).startsWith('ORD-') ? orderReference : '')

    let orderId: number | null = null

    if (explicitOrderId) {
      orderId = explicitOrderId
    } else if (/^\d+$/.test(paymentReference)) {
      orderId = Number.parseInt(paymentReference, 10)
    } else if (/^\d+$/.test(orderReference)) {
      orderId = Number.parseInt(orderReference, 10)
    } else if (paymentReference) {
      const { data: itnLog } = await supabase
        .from('payfast_itn_logs')
        .select('order_id, payment_status')
        .eq('m_payment_id', paymentReference)
        .maybeSingle()

      if (itnLog?.order_id) {
        orderId = Number(itnLog.order_id)
      }
    }

    if (!orderId && explicitOrderNumber) {
      const { data: orderByNumber } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('order_number', explicitOrderNumber)
        .maybeSingle()

      if (orderByNumber?.id) {
        orderId = Number(orderByNumber.id)
      }
    }

    if (!orderId && orderReference) {
      const { data: itnLog } = await supabase
        .from('payfast_itn_logs')
        .select('order_id, payment_status')
        .eq('custom_str1', orderReference)
        .maybeSingle()

      if (itnLog?.order_id) {
        orderId = Number(itnLog.order_id)
      }
    }

    if (!orderId) {
      return NextResponse.json(
        { success: true, message: 'Payment is being processed.' },
        { status: 200 }
      )
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('[v0] Order not found:', fetchError)
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    let newStatus = 'Pending'
    if (pf_payment_status === 'COMPLETE') {
      newStatus = 'Paid'
    } else if (pf_payment_status === 'CANCELLED') {
      newStatus = 'Cancelled'
    } else if (pf_payment_status === 'FAILED') {
      newStatus = 'Failed'
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', orderId)

    if (updateError) {
      console.error('[v0] Error updating order:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update order status' },
        { status: 500 }
      )
    }

    console.log('[v0] Order payment status updated:', { orderId, status: newStatus })

    return NextResponse.json({
      success: true,
      message:
        newStatus === 'Paid'
          ? 'Payment successful!'
          : newStatus === 'Cancelled'
          ? 'Payment cancelled.'
          : newStatus === 'Failed'
          ? 'Payment failed. Please try again.'
          : 'Payment is being processed.',
      newStatus,
    })
  } catch (error) {
    console.error('[v0] Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
