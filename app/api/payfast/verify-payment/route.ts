import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pf_payment_status, m_payment_id } = body

    if (!m_payment_id) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let orderId: number | null = null

    if (/^\d+$/.test(String(m_payment_id))) {
      orderId = Number.parseInt(String(m_payment_id), 10)
    } else {
      const { data: itnLog } = await supabase
        .from('payfast_itn_logs')
        .select('order_id, payment_status')
        .eq('m_payment_id', String(m_payment_id))
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

    // Fetch the order to update its payment status
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

    // Determine payment status based on PayFast response
    let newStatus = 'Pending'
    if (pf_payment_status === 'COMPLETE') {
      newStatus = 'Paid'
    } else if (pf_payment_status === 'FAILED' || pf_payment_status === 'CANCELLED') {
      newStatus = 'Failed'
    }

    // Update order payment status
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
      success: newStatus === 'Paid',
      message: newStatus === 'Paid' 
        ? 'Payment successful!' 
        : newStatus === 'Failed'
        ? 'Payment failed. Please try again.'
        : 'Payment is being processed.',
    })
  } catch (error) {
    console.error('[v0] Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
