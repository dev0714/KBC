import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify JWT token from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('kbc_session')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify and decode JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')
    let payload: any
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = payload.business_id
    const role = payload.role

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID not found in token' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch client profile from clients table where account_no = business_id
    const { data: clientRecord, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('account_no', businessId)
      .maybeSingle()

    if (clientError) {
      throw new Error(`Client query failed: ${clientError.message}`)
    }

    // Fetch user profile from users table where business_id = business_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, phone_number, business_type, status, sales_code, salesperson_name')
      .eq('business_id', businessId)
      .maybeSingle()

    if (userError) {
      throw new Error(`User query failed: ${userError.message}`)
    }

    console.log('[v0] Dashboard - businessId:', businessId)
    console.log('[v0] Dashboard - clientRecord:', clientRecord)
    console.log('[v0] Dashboard - userRecord:', userRecord)

    // Combine user and client data
    const client = {
      ...(userRecord || {}),
      ...(clientRecord || {}),
      business_name:
        clientRecord?.client_name ||
        userRecord?.salesperson_name ||
        userRecord?.full_name ||
        businessId,
    }

    // Fetch orders with items and product details - filtered by business_id
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          sku,
          quantity,
          price,
          tax,
          products (
            title
          )
        )
      `)
      .eq('client_account_no', businessId)
      .order('order_date', { ascending: false })

    if (ordersError) throw new Error(`Orders query failed: ${ordersError.message}`)

    // Quotes table does not exist - return empty array
    const quotes: any[] = []

    // Fetch documents - filtered by business_id
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('client_account_no', businessId)
      .order('created_at', { ascending: false })

    if (docsError) throw new Error(`Documents query failed: ${docsError.message}`)

    // Compute stats
    const totalOrders = orders?.length || 0
    const activeQuotes = 0
    const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0

    return NextResponse.json({
      client: client || null,
      orders: orders?.map(o => ({
        ...o,
        items: o.order_items || [],
      })) || [],
      quotes: [],
      documents: documents || [],
      stats: {
        totalOrders,
        activeQuotes,
        totalSpent,
      },
    })
  } catch (error) {
    console.error('[v0] Dashboard API error:', error)
    return NextResponse.json({
      client: null,
      orders: [],
      quotes: [],
      documents: [],
      stats: { totalOrders: 0, activeQuotes: 0, totalSpent: 0 },
      error: String(error),
    })
  }
}
