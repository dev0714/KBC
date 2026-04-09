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

    // Fetch the order to update its payment status
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', m_payment_id)
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
      .eq('id', m_payment_id)

    if (updateError) {
      console.error('[v0] Error updating order:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update order status' },
        { status: 500 }
      )
    }

    console.log('[v0] Order payment status updated:', { orderId: m_payment_id, status: newStatus })

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
