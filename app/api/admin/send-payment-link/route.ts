import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail } from '@/lib/supabase/send-notification'
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

    await sendNotificationEmail({
      customerEmail: String(customer_email).trim(),
      adminEmail: process.env.ADMIN_EMAIL,
      action: 'PayFast Payment Link',
      status: 'success',
      message: `Your payment link for order ${order_number} is ready.`,
      details: {
        'Order Number': String(order_number),
        'Customer Name': String(customer_name || 'Customer'),
        'Amount': `R${Number(amount).toLocaleString()}`,
        'Payment Link': paymentUrl,
        'Expires': 'Use the link to complete payment',
      },
    })

    return NextResponse.json({
      success: true,
      paymentUrl,
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
