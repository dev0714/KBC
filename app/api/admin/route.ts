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

    // Check admin role
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[v0] Admin API - Supabase client created:', !!supabase)

    // Fetch products in chunks so we can exceed Supabase's default 1000-row response cap.
    const PRODUCTS_BATCH_SIZE = 1000
    let products: any[] = []
    let productsCount = 0
    let productsError: Error | null = null

    const countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery.or(`title.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    const { count: totalProductMatches, error: countError } = await countQuery
    if (countError) throw new Error(`Products count query failed: ${countError.message}`)
    productsCount = totalProductMatches || 0

    for (let from = 0; from < productsCount; from += PRODUCTS_BATCH_SIZE) {
      let batchQuery = supabase
        .from('products')
        .select('*')
        .order('title', { ascending: true })
        .range(from, from + PRODUCTS_BATCH_SIZE - 1)

      if (search) {
        batchQuery = batchQuery.or(`title.ilike.%${search}%,sku.ilike.%${search}%`)
      }

      const { data: batch, error: batchError } = await batchQuery
      if (batchError) {
        productsError = new Error(`Products query failed: ${batchError.message}`)
        break
      }

      products = products.concat(batch || [])

      if (!batch || batch.length < PRODUCTS_BATCH_SIZE) {
        break
      }
    }

    console.log('[v0] Admin API - Products query result:', { count: products?.length, total: productsCount, error: productsError?.message })

    if (productsError) throw productsError

    // Fetch customers in chunks so we can exceed Supabase's default 1000-row response cap.
    const CLIENTS_BATCH_SIZE = 1000
    let clients: any[] = []
    let clientsError: Error | null = null

    const clientsCountQuery = supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: totalClientMatches, error: clientsCountError } = await clientsCountQuery
    if (clientsCountError) throw new Error(`Clients count query failed: ${clientsCountError.message}`)

    for (let from = 0; from < (totalClientMatches || 0); from += CLIENTS_BATCH_SIZE) {
      const { data: batch, error: batchError } = await supabase
        .from('clients')
        .select(`
          client_name,
          account_no,
          address,
          created_at,
          contacts(id, full_name, email, phone_number, business_type),
          users(id, email, full_name, phone_number, business_type, status)
        `)
        .order('created_at', { ascending: false })
        .range(from, from + CLIENTS_BATCH_SIZE - 1)

      if (batchError) {
        clientsError = new Error(`Clients query failed: ${batchError.message}`)
        break
      }

      clients = clients.concat(batch || [])

      if (!batch || batch.length < CLIENTS_BATCH_SIZE) {
        break
      }
    }

    if (clientsError) throw clientsError

    // Transform clients data to flatten the joined user info
    const enrichedClients = clients?.map((client: any) => ({
      ...client,
      contact: Array.isArray(client.contacts) ? client.contacts[0] : client.contacts,
      client_name: client.client_name,
      account_no: client.account_no,
      address: client.address,
      full_name: (Array.isArray(client.contacts) ? client.contacts[0] : client.contacts)?.full_name
        || (() => {
          const users = Array.isArray(client.users) ? client.users : (client.users ? [client.users] : [])
          return users.find((user: any) => user?.status === 'approved' || user?.status === 'active')?.full_name
            || users[0]?.full_name
            || null
        })(),
      email: (Array.isArray(client.contacts) ? client.contacts[0] : client.contacts)?.email
        || (() => {
          const users = Array.isArray(client.users) ? client.users : (client.users ? [client.users] : [])
          return users.find((user: any) => user?.status === 'approved' || user?.status === 'active')?.email
            || users[0]?.email
            || null
        })(),
      phone_number: (Array.isArray(client.contacts) ? client.contacts[0] : client.contacts)?.phone_number
        || (() => {
          const users = Array.isArray(client.users) ? client.users : (client.users ? [client.users] : [])
          return users.find((user: any) => user?.status === 'approved' || user?.status === 'active')?.phone_number
            || users[0]?.phone_number
            || null
        })(),
      business_type: (Array.isArray(client.contacts) ? client.contacts[0] : client.contacts)?.business_type
        || (() => {
          const users = Array.isArray(client.users) ? client.users : (client.users ? [client.users] : [])
          return users.find((user: any) => user?.status === 'approved' || user?.status === 'active')?.business_type
            || users[0]?.business_type
            || null
        })(),
      status: (() => {
        const users = Array.isArray(client.users) ? client.users : (client.users ? [client.users] : [])
        return users.find((user: any) => user?.status === 'approved' || user?.status === 'active')?.status
          || users[0]?.status
          || null
      })(),
      user_id: (() => {
        const users = Array.isArray(client.users) ? client.users : (client.users ? [client.users] : [])
        return users.find((user: any) => user?.status === 'approved' || user?.status === 'active')?.id
          || users[0]?.id
          || null
      })(),
      created_at: client.created_at,
    })) || []

    // Fetch all orders with item counts, product details and client name
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`*, clients(client_name), order_items(id, sku, quantity, price, tax, products(title))`)
      .order('order_date', { ascending: false })

    if (ordersError) throw new Error(`Orders query failed: ${ordersError.message}`)

    // Enrich orders with client name and normalise order_items
    const enrichedOrders = orders?.map((order: any) => {
      const clientData = Array.isArray(order.clients) ? order.clients[0] : order.clients
      const matchingClient = enrichedClients.find(
        client => String(client.account_no) === String(order.client_account_no)
      ) || null
      const clientEmail = matchingClient?.email || null
      const clientContactEmail = matchingClient?.contact?.email || null
      // Normalise order_items so products is always an object, not an array
      const normalizedItems = (order.order_items || []).map((item: any) => ({
        ...item,
        products: Array.isArray(item.products) ? item.products[0] : item.products,
      }))
      return {
        ...order,
        client_name: clientData?.client_name || order.client_account_no || 'Unknown',
        client_email: clientEmail,
        client_contact_email: clientContactEmail,
        order_items: normalizedItems,
      }
    })

    // Compute stats with dedicated count queries
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    const { count: activeCustomers } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')

    // Calculate top 5 customers by order count
    const orderCountMap = new Map<string, number>()
    orders?.forEach((order: any) => {
      const accountNo = order.client_account_no
      orderCountMap.set(accountNo, (orderCountMap.get(accountNo) || 0) + 1)
    })

    const topCustomers = enrichedClients
      .filter(client => orderCountMap.get(client.account_no))
      .map(client => ({
        ...client,
        order_count: orderCountMap.get(client.account_no) || 0,
      }))
      .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
      .slice(0, 5)

    // Enrich all clients with order counts
    const clientsWithOrderCounts = enrichedClients?.map(client => ({
      ...client,
      order_count: orderCountMap.get(client.account_no) || 0,
    }))

    const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0

    return NextResponse.json({
      products: products || [],
      productsTotal: productsCount || 0,
      clients: clientsWithOrderCounts || [],
      topCustomers: topCustomers || [],
      orders: enrichedOrders || [],
      stats: {
        totalProducts: totalProducts || 0,
        activeCustomers: activeCustomers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
      },
    })
  } catch (error) {
    console.error('[v0] Admin API error:', error)
    return NextResponse.json({
      products: [],
      productsTotal: 0,
      clients: [],
      topCustomers: [],
      orders: [],
      stats: { totalProducts: 0, activeCustomers: 0, totalOrders: 0, totalRevenue: 0 },
      error: String(error),
    })
  }
}
