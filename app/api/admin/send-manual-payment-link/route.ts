import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function buildPaymentEmailHtml(params: {
  customerName: string
  amount: string
  paymentUrl: string
  note?: string
}) {
  return `<!DOCTYPE html>
  <html>
    <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
        <div style="background:#0b2a5b;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(11,42,91,.18);">
          <div style="background:linear-gradient(135deg,#c1121f,#e11d48);color:#fff;padding:28px 32px;">
            <h1 style="margin:0;font-size:28px;line-height:1.2;">Your KBC Payment Link</h1>
            <p style="margin:10px 0 0;font-size:14px;opacity:.95;">Manual payment request</p>
          </div>
          <div style="padding:32px;color:#e2e8f0;">
            <p style="margin:0 0 16px;font-size:16px;">Hi ${params.customerName || 'Customer'},</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#cbd5e1;">
              Your PayFast payment link is ready. Click the button below to complete payment for <strong>R${params.amount}</strong>.
            </p>
            ${params.note ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#94a3b8;">${params.note}</p>` : ''}
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

async function resolveCustomer(
  supabase: ReturnType<typeof createClient>,
  customerAccountNo: string,
  customerName?: string,
  customerEmail?: string
) {
  const trimmedAccount = String(customerAccountNo || '').trim()
  if (!trimmedAccount) return null

  const { data: clientRecord } = await supabase
    .from('clients')
    .select('account_no, client_name, contacts(id, email, full_name), users(id, email)')
    .eq('account_no', trimmedAccount)
    .maybeSingle()

  if (!clientRecord) return null

  const contactRecord = Array.isArray(clientRecord.contacts)
    ? clientRecord.contacts[0]
    : clientRecord.contacts
  const userRecord = Array.isArray(clientRecord.users)
    ? clientRecord.users[0]
    : clientRecord.users

  const resolvedEmail =
    contactRecord?.email?.trim() ||
    customerEmail?.trim() ||
    userRecord?.email?.trim() ||
    null

  if (resolvedEmail && !contactRecord?.email?.trim()) {
    await supabase
      .from('contacts')
      .upsert(
        {
          client_account_no: trimmedAccount,
          full_name: customerName?.trim() || clientRecord.client_name || null,
          email: resolvedEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_account_no' }
      )
  }

  return {
    accountNo: clientRecord.account_no,
    name: clientRecord.client_name || customerName || 'Customer',
    email: resolvedEmail,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const customerAccountNo = String(body.customer_account_no || body.client_account_no || '').trim()
    const customerName = String(body.customer_name || '').trim()
    const customerEmail = String(body.customer_email || '').trim()
    const amount = Number(body.amount)
    const note = String(body.note || body.item_description || '').trim()
    const itemName = String(body.item_name || `Manual payment for ${customerName || customerAccountNo || 'customer'}`).trim()
    const paymentUrlFromBody = typeof body.payment_url === 'string'
      ? body.payment_url.trim()
      : typeof body.paymentUrl === 'string'
        ? body.paymentUrl.trim()
        : ''

    if (!customerAccountNo || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'customer_account_no and amount are required' },
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
    const resolvedCustomer = await resolveCustomer(supabase, customerAccountNo, customerName, customerEmail)

    if (!resolvedCustomer?.email) {
      return NextResponse.json(
        { error: 'Customer email not found', details: `No contact email stored for ${customerAccountNo}` },
        { status: 404 }
      )
    }

    const manualOrderNumber = `ORD-${Date.now()}`
    const manualOrderDate = new Date().toISOString()
    const manualTaxAmount = Number((amount * 0.15).toFixed(2))

    const { data: manualOrder, error: manualOrderError } = await supabase
      .from('orders')
      .insert({
        order_number: manualOrderNumber,
        client_account_no: resolvedCustomer.accountNo,
        order_date: manualOrderDate,
        total_amount: amount.toFixed(2),
        total_tax_amount: manualTaxAmount,
        shipping_amount: 0,
        payment_status: 'Pending',
      })
      .select('id, order_number')
      .single()

    if (manualOrderError || !manualOrder) {
      return NextResponse.json(
        {
          error: 'Failed to create manual order',
          details: manualOrderError?.message || 'Unable to insert pending order',
        },
        { status: 500 }
      )
    }

    let paymentUrl = paymentUrlFromBody
    if (!paymentUrl) {
      const payFastUrl = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_URL
      const payFastKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY
      const requestUrl = new URL(req.url)
      const siteOrigin = requestUrl.origin
      const orderReference = String(manualOrder.id)

      if (!payFastUrl || !payFastKey) {
        return NextResponse.json(
          { error: 'Missing PaySync configuration' },
          { status: 500 }
        )
      }

      const paymentResponse = await fetch(`${payFastUrl}/functions/v1/PaySync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${payFastKey}`,
        },
        body: JSON.stringify({
          id: 2,
          client_id: resolvedCustomer.accountNo,
          amount: amount.toFixed(2),
          item_name: `Order ${manualOrder.order_number}`,
          item_description: note || `Manual payment for ${resolvedCustomer.name}`,
          name_first: resolvedCustomer.name.split(' ')[0] || 'Customer',
          name_last: resolvedCustomer.name.split(' ').slice(1).join(' '),
          cell_number: '',
          custom_int1: '1',
          custom_str1: orderReference,
          return_url: `${siteOrigin}/payment-success?order_id=${encodeURIComponent(orderReference)}`,
          cancel_url: `${siteOrigin}/payment-cancel?order_id=${encodeURIComponent(orderReference)}&order_number=${encodeURIComponent(manualOrder.order_number)}`,
          notify_url: `${siteOrigin}/api/payfast/notify`,
        }),
      })

      const paymentData = await paymentResponse.json().catch(() => null)

      if (!paymentResponse.ok) {
        return NextResponse.json(
          {
            error: paymentData?.error || 'Failed to create payment link',
            details: paymentData?.details || paymentData?.message || paymentData,
          },
          { status: paymentResponse.status }
        )
      }

      paymentUrl = paymentData.url || paymentData.shortened_url || ''
    }

    if (!paymentUrl) {
      return NextResponse.json(
        { error: 'Missing payment URL' },
        { status: 400 }
      )
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      process.env.ADMIN_EMAIL ||
      'kbc@notification.leadsync.co.za'

    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: `${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: resolvedCustomer.email,
        from: fromEmail,
        subject: `PayFast payment link for ${resolvedCustomer.name}`,
        html: buildPaymentEmailHtml({
          customerName: resolvedCustomer.name,
          amount: amount.toFixed(2),
          paymentUrl,
          note: note || undefined,
        }),
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      return NextResponse.json(
        { error: 'Failed to send email', details: errorText, paymentUrl },
        { status: emailResponse.status }
      )
    }

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: true,
      paymentUrl,
      emailResult,
      customer: resolvedCustomer,
      message: 'Manual payment link emailed successfully',
    })
  } catch (error) {
    console.error('[v0] Manual payment link error:', error)
    return NextResponse.json(
      { error: 'Failed to send manual payment link', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
