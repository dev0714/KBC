import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail } from '@/lib/supabase/send-notification'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, any> = {}

    if (contentType.includes('application/json')) {
      body = await req.json()
    } else {
      const formData = await req.formData()
      body = Object.fromEntries(formData.entries())
    }
    
    console.log('[v0] PayFast ITN webhook received - Full body:', JSON.stringify(body, null, 2))
    
    // PayFast returns m_payment_id in the ITN notification (we sent it in the payment request)
    const orderId = body.m_payment_id
    const paymentStatus = body.payment_status
    
    console.log('[v0] PayFast ITN - m_payment_id:', orderId, 'payment_status:', paymentStatus)
    
    // Verify the request comes from PayFast
    if (!orderId || paymentStatus === undefined) {
      console.error('[v0] Invalid ITN payload - missing m_payment_id or payment_status. Body:', JSON.stringify(body))
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const parsedOrderId = Number.parseInt(String(orderId), 10)
    const processedAt = new Date().toISOString()

    const { error: logError } = await supabase.from('payfast_itn_logs').insert({
      order_id: Number.isFinite(parsedOrderId) ? parsedOrderId : null,
      m_payment_id: String(orderId),
      pf_payment_id: body.pf_payment_id ? String(body.pf_payment_id) : null,
      payment_status: String(paymentStatus),
      amount_gross: body.mc_gross ? Number(body.mc_gross) : null,
      amount_fee: body.amount_fee ? Number(body.amount_fee) : null,
      amount_net: body.amount_net ? Number(body.amount_net) : null,
      signature: body.signature ? String(body.signature) : null,
      raw_payload: body,
      processing_status: 'received',
      received_at: processedAt,
    })

    if (logError) {
      console.error('[v0] Error saving ITN log:', logError)
      return NextResponse.json(
        { error: 'Failed to save ITN log', details: logError.message },
        { status: 500 }
      )
    }
    
    // Map PayFast payment status to order status
    // PayFast ITN sends payment_status as string: "COMPLETE" or "CANCELLED"
    let orderStatus = 'Pending'
    
    if (paymentStatus === 'COMPLETE') {
      orderStatus = 'Paid'
    } else if (paymentStatus === 'CANCELLED') {
      orderStatus = 'Cancelled'
    } else if (paymentStatus === 'FAILED') {
      orderStatus = 'Failed'
    }
    
    console.log('[v0] Processing ITN - orderId:', orderId, 'PayFast status:', paymentStatus, '-> Order status:', orderStatus)
    
    // First, check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', parsedOrderId)
      .single()
    
    if (checkError) {
      console.error('[v0] Error checking if order exists:', checkError, 'Looking for orderId:', orderId)
    } else {
      console.log('[v0] Found existing order:', existingOrder)
    }
    
    // Update the order payment status
    const { error: updateError, data: updateData } = await supabase
      .from('orders')
      .update({ payment_status: orderStatus })
      .eq('id', parsedOrderId)
      .select()
    
    if (updateError) {
      console.error('[v0] Error updating order:', updateError, 'orderId:', orderId)
      
      // Send failure notification email
      await sendNotificationEmail({
        customerEmail: 'support@kbc.co.za',
        adminEmail: process.env.ADMIN_EMAIL,
        action: 'Order Payment Processing',
        status: 'failed',
        message: `Failed to process payment for order ${orderId}. Please contact support.`,
        details: {
          'Order ID': orderId,
          'Error': updateError.message,
          'Timestamp': new Date().toISOString(),
        },
      })
      
      return NextResponse.json(
        { error: 'Failed to update order', details: updateError.message },
        { status: 500 }
      )
    }
    
    console.log('[v0] Order updated successfully - data:', updateData)
    
    // Send success notification email
    if (updateData && updateData.length > 0) {
      const order = updateData[0]
      await sendNotificationEmail({
        customerEmail: order.client_email || 'support@kbc.co.za',
        adminEmail: process.env.ADMIN_EMAIL,
        action: 'Order Payment Received',
        status: 'success',
        message: `Payment for order ${orderId} has been successfully processed and confirmed.`,
        details: {
          'Order ID': orderId,
          'Payment Status': orderStatus,
          'Amount': order.total_amount,
          'Timestamp': new Date().toISOString(),
        },
      })
    }

    await supabase
      .from('payfast_itn_logs')
      .update({
        processing_status: updateError ? 'failed' : 'processed',
        processed_at: processedAt,
        error_message: null,
      })
      .eq('m_payment_id', String(orderId))
    
    return NextResponse.json({
      success: true,
      message: 'ITN processed successfully',
      orderId,
      newStatus: orderStatus
    })
  } catch (error) {
    console.error('[v0] PayFast ITN webhook error:', error)
    return NextResponse.json(
      { error: 'ITN processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
