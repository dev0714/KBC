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
    
    // PayFast returns the generated payment reference in m_payment_id.
    // The actual order reference is stored in custom_str1.
    const paymentReference = body.m_payment_id
    const orderReference = body.custom_str1
    const paymentStatus = body.payment_status
    
    console.log('[v0] PayFast ITN - paymentReference:', paymentReference, 'orderReference:', orderReference, 'payment_status:', paymentStatus)
    
    // Verify the request comes from PayFast
    if (!paymentReference || !orderReference || paymentStatus === undefined) {
      console.error('[v0] Invalid ITN payload - missing m_payment_id, custom_str1, or payment_status. Body:', JSON.stringify(body))
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const parsedOrderId = Number.parseInt(String(orderReference), 10)
    const processedAt = new Date().toISOString()

    const logEntry = {
      order_id: Number.isFinite(parsedOrderId) ? parsedOrderId : null,
      item_name: body.item_name ? String(body.item_name) : null,
      name_first: body.name_first ? String(body.name_first) : null,
      name_last: body.name_last ? String(body.name_last) : null,
      signature: body.signature ? String(body.signature) : null,
      amount_fee: body.amount_fee ? Number(body.amount_fee) : null,
      amount_net: body.amount_net ? Number(body.amount_net) : null,
      amount_gross: body.amount_gross ? Number(body.amount_gross) : body.mc_gross ? Number(body.mc_gross) : null,
      custom_int1: body.custom_int1 ? String(body.custom_int1) : null,
      custom_int2: body.custom_int2 ? String(body.custom_int2) : null,
      custom_int3: body.custom_int3 ? String(body.custom_int3) : null,
      custom_int4: body.custom_int4 ? String(body.custom_int4) : null,
      custom_int5: body.custom_int5 ? String(body.custom_int5) : null,
      custom_str1: body.custom_str1 ? String(body.custom_str1) : null,
      custom_str2: body.custom_str2 ? String(body.custom_str2) : null,
      custom_str3: body.custom_str3 ? String(body.custom_str3) : null,
      custom_str4: body.custom_str4 ? String(body.custom_str4) : null,
      custom_str5: body.custom_str5 ? String(body.custom_str5) : null,
      merchant_id: body.merchant_id ? String(body.merchant_id) : null,
      email_address: body.email_address ? String(body.email_address) : null,
      m_payment_id: String(paymentReference),
      pf_payment_id: body.pf_payment_id ? String(body.pf_payment_id) : null,
      payment_status: String(paymentStatus),
      item_description: body.item_description ? String(body.item_description) : null,
      raw_payload: body,
      processing_status: 'received',
      received_at: processedAt,
      processed_at: processedAt,
    }

    const { data: existingLog } = await supabase
      .from('payfast_itn_logs')
      .select('id')
      .eq('m_payment_id', String(paymentReference))
      .maybeSingle()

    const { error: logError } = existingLog?.id
      ? await supabase
        .from('payfast_itn_logs')
        .update(logEntry)
        .eq('id', existingLog.id)
      : await supabase.from('payfast_itn_logs').insert(logEntry)

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
    
    console.log('[v0] Processing ITN - orderReference:', orderReference, 'PayFast status:', paymentStatus, '-> Order status:', orderStatus)
    
    // First, check if order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', parsedOrderId)
      .single()
    
    if (checkError) {
      console.error('[v0] Error checking if order exists:', checkError, 'Looking for orderReference:', orderReference)
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
      console.error('[v0] Error updating order:', updateError, 'orderReference:', orderReference)
      
      // Send failure notification email
      await sendNotificationEmail({
        customerEmail: 'support@kbc.co.za',
        adminEmail: process.env.ADMIN_EMAIL,
        action: 'Order Payment Processing',
        status: 'failed',
        message: `Failed to process payment for order ${orderReference}. Please contact support.`,
        details: {
          'Order ID': orderReference,
          'Payment Reference': paymentReference,
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
        message: `Payment for order ${orderReference} has been successfully processed and confirmed.`,
        details: {
          'Order ID': orderReference,
          'Payment Reference': paymentReference,
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
      .eq('m_payment_id', String(paymentReference))
    
    return NextResponse.json({
      success: true,
      message: 'ITN processed successfully',
      orderId: orderReference,
      paymentReference,
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
