import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function buildPaymentEmailHtml(params: {
  customerName: string
  orderNumber: string
  amount: string
  paymentUrl: string
}) {
  return `<!DOCTYPE html>
  <html>
    <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
        <div style="background:#0b2a5b;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(11,42,91,.18);">
          <div style="background:linear-gradient(135deg,#c1121f,#e11d48);color:#fff;padding:28px 32px;">
            <h1 style="margin:0;font-size:28px;line-height:1.2;">Your KBC Payment Link</h1>
            <p style="margin:10px 0 0;font-size:14px;opacity:.95;">Order ${params.orderNumber}</p>
          </div>
          <div style="padding:32px;color:#e2e8f0;">
            <p style="margin:0 0 16px;font-size:16px;">Hi ${params.customerName || 'Customer'},</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#cbd5e1;">
              Your PayFast payment link is ready. Click the button below to complete payment for <strong>Order ${params.orderNumber}</strong>.
            </p>
            <div style="margin:28px 0;">
              <a href="${params.paymentUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;">
                Pay R${params.amount}
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Amount</p>
            <p style="margin:0 0 20px;font-size:18px;font-weight:bold;color:#fff;">R${params.amount}</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
              If the button does not work, copy and paste this link into your browser:<br />
              <a href="${params.paymentUrl}" style="color:#60a5fa;word-break:break-all;">${params.paymentUrl}</a>
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>`
}

async function resolveCustomerEmail(
  supabase: ReturnType<typeof createClient>,
  orderId: string | number,
  orderNumber: string,
  providedEmail?: string | null
) {
  if (providedEmail && providedEmail.trim()) {
    return providedEmail.trim()
  }

  const orderIdString = String(orderId).trim()
  const orderNumberString = String(orderNumber).trim()

  const { data: orderById } = await supabase
    .from('orders')
    .select('client_account_no')
    .eq('id', orderIdString)
    .maybeSingle()

  const orderByNumber = orderById
    ? orderById
    : (await supabase
        .from('orders')
        .select('client_account_no')
        .eq('order_number', orderNumberString)
        .maybeSingle()).data

  const clientAccountNo = String(orderByNumber?.client_account_no || '').trim()
  if (!clientAccountNo) {
    return null
  }

  const { data: clientRecord } = await supabase
    .from('clients')
    .select('account_no, contacts(id, email), users(id, email)')
    .eq('account_no', clientAccountNo)
    .maybeSingle()

  const contactRecord = Array.isArray(clientRecord?.contacts)
    ? clientRecord.contacts[0]
    : clientRecord?.contacts

  const userRecord = Array.isArray(clientRecord?.users)
    ? clientRecord.users[0]
    : clientRecord?.users

  return contactRecord?.email?.trim() || userRecord?.email?.trim() || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order_number, order_id, customer_email, customer_name, amount, item_name, item_description } = body

    if (!order_number || !order_id || !amount || !item_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const resolvedCustomerEmail = await resolveCustomerEmail(
      supabase,
      order_id,
      order_number,
      customer_email
    )

    if (!resolvedCustomerEmail) {
      return NextResponse.json(
        { error: 'Customer email not found for this order' },
        { status: 404 }
      )
    }

    const paymentResponse = await fetch(new URL('/api/payfast/create-payment', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '1',
        amount: Number(amount).toFixed(2),
        item_name: String(item_name).trim(),
        item_description: item_description ? String(item_description).trim() : '',
        name_first: customer_name ? String(customer_name).trim().split(' ')[0] : 'Customer',
        name_last: customer_name ? String(customer_name).trim().split(' ').slice(1).join(' ') : '',
        email_address: resolvedCustomerEmail,
        cell_number: '',
        custom_int1: '1',
        custom_str1: String(order_id),
      }),
    })

    if (!paymentResponse.ok) {
      const paymentError = await paymentResponse.json().catch(() => null)
      return NextResponse.json(
        {
          error: paymentError?.error || 'Failed to create payment link',
          details: paymentError?.details || paymentError?.message || null,
        },
        { status: paymentResponse.status }
      )
    }

    const paymentData = await paymentResponse.json()
    const paymentUrl = paymentData.url

    if (!paymentUrl) {
      return NextResponse.json(
        { error: 'No payment URL returned from payment API' },
        { status: 500 }
      )
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      process.env.ADMIN_EMAIL ||
      'kbc@notification.leadsync.co.za'

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: `${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: resolvedCustomerEmail,
        from: fromEmail,
        subject: `PayFast payment link for order ${order_number}`,
        html: buildPaymentEmailHtml({
          customerName: String(customer_name || 'Customer'),
          orderNumber: String(order_number),
          amount: Number(amount).toFixed(2),
          paymentUrl,
        }),
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      return NextResponse.json(
        { error: 'Failed to send email', details: errorText },
        { status: emailResponse.status }
      )
    }

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: true,
      paymentUrl,
      emailResult,
      message: 'Payment link emailed successfully',
    })
  } catch (error) {
    console.error('[v0] Send payment link error:', error)
    return NextResponse.json(
      { error: 'Failed to send payment link', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
