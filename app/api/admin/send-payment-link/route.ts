import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function generateSignature(data: Record<string, string>, passphrase: string) {
  const queryString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(String(data[key])).replace(/%20/g, '+')}`)
    .join('&')

  const signatureString = passphrase ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : queryString
  return createHash('md5').update(signatureString).digest('hex')
}

function buildPaymentUrl(baseUrl: string, data: Record<string, string>, signature: string) {
  const queryString = Object.entries({ ...data, signature })
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}`)
    .join('&')

  return `${baseUrl}?${queryString}`
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order_number, order_id, customer_email, customer_name, amount, item_name, item_description } = body

    if (!order_number || !order_id || !customer_email || !amount || !item_name) {
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

    const { data: paymentConfig, error: configError } = await supabase
      .from('payfast_payment_configs')
      .select('*')
      .limit(1)
      .single()

    if (configError || !paymentConfig) {
      return NextResponse.json(
        { error: configError?.message || 'Payment configuration not found' },
        { status: 404 }
      )
    }

    const paymentId = `PAY-${crypto.randomUUID()}`
    const paymentData: Record<string, string> = {
      merchant_id: String(paymentConfig.merchant_id).trim(),
      merchant_key: String(paymentConfig.merchant_key).trim(),
      return_url: String(paymentConfig.return_url).trim(),
      cancel_url: String(paymentConfig.cancel_url).trim(),
      notify_url: String(paymentConfig.notify_url).trim(),
      m_payment_id: paymentId,
      amount: Number(amount).toFixed(2),
      item_name: String(item_name).trim(),
      name_first: customer_name ? String(customer_name).trim().split(' ')[0] : 'Customer',
      name_last: customer_name ? String(customer_name).trim().split(' ').slice(1).join(' ') : '',
      email_address: String(customer_email).trim(),
      custom_str1: String(order_id),
      custom_int1: '1',
    }

    if (item_description) {
      paymentData.item_description = String(item_description).trim()
    }

    const signature = generateSignature(paymentData, String(paymentConfig.passphrase))

    const baseUrl = paymentConfig.is_sandbox === false
      ? 'https://www.payfast.co.za/eng/process'
      : 'https://sandbox.payfast.co.za/eng/process'

    const paymentUrl = buildPaymentUrl(baseUrl, paymentData, signature)

    const supabaseFunctionUrl = `${supabaseUrl}/functions/v1/send-email`
    const emailResponse = await fetch(supabaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
      body: JSON.stringify({
        to: customer_email,
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
