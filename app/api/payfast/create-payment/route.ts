import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const requestUrl = new URL(req.url)
    const siteOrigin = requestUrl.origin
    const paymentSource = String(body.source || body.context || 'customer').toLowerCase()
    const isAdminFlow = paymentSource === 'admin'
    
    console.log('[v0] PayFast payment request received:', { amount: body.amount, item_name: body.item_name, id: body.id })
    
    // Validate required fields
    const clientId = body.id ?? body.client_id

    if (!body.amount || !body.item_name || clientId === undefined || clientId === null || String(clientId).trim() === '') {
      console.error('[v0] Missing required fields:', { amount: body.amount, item_name: body.item_name, id: body.id, client_id: body.client_id })
      return NextResponse.json(
        { error: 'Missing required fields (amount, item_name, id)' },
        { status: 400 }
      )
    }

    const payFastUrl = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_URL
    const payFastKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY
    
    if (!payFastUrl || !payFastKey) {
      console.error('[v0] Missing PaySync environment variables')
      return NextResponse.json(
        { error: 'Missing PaySync credentials' },
        { status: 500 }
      )
    }

    const edgeFunctionUrl = `${payFastUrl}/functions/v1/PaySync`
    const orderReference = String(body.custom_str1 || clientId)
    
    const orderNumber = String(body.order_number || body.orderNumber || '').trim()
    const paymentPayload = {
      id: String(clientId),
      m_payment_id: body.custom_str1, // Send order ID as m_payment_id so PayFast returns it in ITN
      amount: parseFloat(body.amount).toFixed(2),
      item_name: body.item_name,
      item_description: body.item_description || '',
      name_first: body.name_first || 'Customer',
      name_last: body.name_last || '',
      email_address: body.email_address || '',
      cell_number: body.cell_number || '',
      custom_int1: body.custom_int1 || '1',
      custom_str1: body.custom_str1,
      return_url: `${siteOrigin}/payment-success?order_id=${encodeURIComponent(orderReference)}${isAdminFlow ? '&source=admin' : ''}`,
      cancel_url: `${siteOrigin}/payment-cancel?order_id=${encodeURIComponent(orderReference)}&order_number=${encodeURIComponent(orderNumber || body.item_name || '')}${isAdminFlow ? '&source=admin' : ''}`,
      notify_url: `${siteOrigin}/api/payfast/notify`,
    }
    
    console.log('[v0] Payment payload:', paymentPayload)
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payFastKey}`,
      },
      body: JSON.stringify(paymentPayload),
    })

    const paymentData = await response.json()
    
    console.log('[v0] PaySync response status:', response.status)
    console.log('[v0] PaySync response:', paymentData)
    
    if (!response.ok) {
      console.error('[v0] PaySync error:', { status: response.status, error: paymentData })
      return NextResponse.json(
        { error: paymentData.error || 'Failed to create payment', details: paymentData.message || paymentData.details },
        { status: response.status }
      )
    }

    if (!paymentData.url && !paymentData.shortened_url) {
      throw new Error('No payment URL returned from PaySync')
    }

    const paymentUrl = paymentData.shortened_url || paymentData.url
    const paymentIdMatch = String(paymentUrl).match(/[?&]m_payment_id=([^&]+)/)
    const paymentId = paymentIdMatch ? decodeURIComponent(paymentIdMatch[1]) : String(body.custom_str1 || '')

    if (paymentId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          await supabase.from('payfast_client_payments').upsert({
            client_id: String(body.client_id || body.accountNo || ''),
            payment_id: paymentId,
            amount: parseFloat(body.amount),
            item_name: String(body.item_name || ''),
            item_description: String(body.item_description || ''),
            email_address: String(body.email_address || ''),
            cell_number: String(body.cell_number || ''),
            name_first: String(body.name_first || ''),
            name_last: String(body.name_last || ''),
            status: 'pending',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'payment_id' })
        }
      } catch (persistError) {
        console.error('[v0] Failed to persist PayFast payment mapping:', persistError)
      }
    }

    console.log('[v0] PayFast URL returned from PaySync:', paymentUrl)

    return NextResponse.json({ url: paymentUrl }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    })

  } catch (error) {
    console.error('[v0] PayFast API error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
