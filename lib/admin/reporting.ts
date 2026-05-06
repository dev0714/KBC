export type ReportingOrderItem = {
  sku?: string | null
  quantity?: number | string | null
  price?: number | string | null
  products?: { title?: string | null; sku?: string | null } | Array<{ title?: string | null; sku?: string | null }> | null
  title?: string | null
}

export type ReportingOrder = {
  order_number?: string | null
  client_account_no?: string | null
  client_name?: string | null
  total_amount?: number | string | null
  order_date?: string | Date | null
  payment_status?: string | null
  order_items?: ReportingOrderItem[] | ReportingOrderItem | null
  items?: ReportingOrderItem[] | ReportingOrderItem | null
  orderItems?: ReportingOrderItem[] | ReportingOrderItem | null
}

export type ReportingClient = {
  account_no?: string | null
  client_name?: string | null
  business_name?: string | null
  full_name?: string | null
}

export type ReportingInput = {
  orders?: ReportingOrder[] | null
  clients?: ReportingClient[] | null
}

export type ReportingModel = {
  productRankings: Array<{ sku: string; title: string; unitsSold: number; revenue: number }>
  customerRankings: Array<{ account_no: string; client_name: string; orderCount: number; totalSpend: number }>
  orderRankings: Array<{ order_number: string; client_name: string; total_amount: number; order_date: string; payment_status: string }>
  dailyRevenue: Array<{ label: string; revenue: number }>
  peakTimeBuckets: Array<{ label: string; count: number }>
}

type ProductAggregate = {
  sku: string
  title: string
  unitsSold: number
  revenue: number
}

type CustomerAggregate = {
  account_no: string
  client_name: string
  orderCount: number
  totalSpend: number
}

type OrderAggregate = {
  order_number: string
  client_name: string
  total_amount: number
  order_date: string
  payment_status: string
}

const HOUR_LABELS = [
  '12 AM',
  '1 AM',
  '2 AM',
  '3 AM',
  '4 AM',
  '5 AM',
  '6 AM',
  '7 AM',
  '8 AM',
  '9 AM',
  '10 AM',
  '11 AM',
  '12 PM',
  '1 PM',
  '2 PM',
  '3 PM',
  '4 PM',
  '5 PM',
  '6 PM',
  '7 PM',
  '8 PM',
  '9 PM',
  '10 PM',
  '11 PM',
]

export function buildReportingModel(input: ReportingInput): ReportingModel {
  const orders = Array.isArray(input?.orders) ? input.orders : []
  const clients = Array.isArray(input?.clients) ? input.clients : []
  const clientNameByAccount = buildClientNameLookup(clients)

  const productMap = new Map<string, ProductAggregate>()
  const customerMap = new Map<string, CustomerAggregate>()
  const orderRankings: OrderAggregate[] = []
  const dailyRevenueMap = new Map<string, number>()
  const peakTimeMap = new Map<number, number>()

  for (const rawOrder of orders) {
    const order = normalizeOrder(rawOrder)
    if (!order.order_number) continue

    orderRankings.push({
      order_number: order.order_number,
      client_name: resolveCustomerName(normalizeString(order.client_account_no) || normalizeString(order.client_name), order.client_name, clientNameByAccount),
      total_amount: order.total_amount,
      order_date: order.order_date,
      payment_status: order.payment_status,
    })

    const customerAccountNo = normalizeString(order.client_account_no)
    const customerName = resolveCustomerName(customerAccountNo || normalizeString(order.client_name), order.client_name, clientNameByAccount)
    const customerKey = customerAccountNo || normalizeString(order.client_name) || '__unknown_customer__'
    if (customerKey || customerName) {
      const existing = customerMap.get(customerKey) || {
        account_no: customerAccountNo,
        client_name: customerName,
        orderCount: 0,
        totalSpend: 0,
      }

      existing.orderCount += 1
      existing.totalSpend += order.total_amount
      existing.client_name = existing.client_name || customerName
      customerMap.set(customerKey, existing)
    }

    const dayKey = getLocalDayKey(order.order_date)
    if (dayKey) {
      dailyRevenueMap.set(dayKey, (dailyRevenueMap.get(dayKey) || 0) + order.total_amount)
    }

    const hour = getLocalHour(order.order_date)
    if (hour !== null) {
      peakTimeMap.set(hour, (peakTimeMap.get(hour) || 0) + 1)
    }

    for (const item of getOrderItems(rawOrder)) {
      const quantity = toNumber(item.quantity, 0)
      const unitPrice = toNumber(item.price, 0)
      const lineRevenue = quantity * unitPrice
      const sku = resolveSku(item)
      const title = resolveProductTitle(item, sku)

      if (!sku) continue

      const existing = productMap.get(sku) || {
        sku,
        title,
        unitsSold: 0,
        revenue: 0,
      }

      existing.unitsSold += quantity
      existing.revenue += lineRevenue
      existing.title = existing.title || title
      productMap.set(sku, existing)
    }
  }

  const productRankings = [...productMap.values()].sort((a, b) =>
    b.revenue - a.revenue ||
    b.unitsSold - a.unitsSold ||
    a.title.localeCompare(b.title) ||
    a.sku.localeCompare(b.sku)
  )

  const customerRankings = [...customerMap.values()].sort((a, b) =>
    b.totalSpend - a.totalSpend ||
    b.orderCount - a.orderCount ||
    a.client_name.localeCompare(b.client_name) ||
    a.account_no.localeCompare(b.account_no)
  )

  const normalizedOrderRankings = orderRankings.sort((a, b) =>
    b.total_amount - a.total_amount ||
    compareDateStringsDesc(a.order_date, b.order_date) ||
    a.order_number.localeCompare(b.order_number)
  )

  const dailyRevenue = [...dailyRevenueMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, revenue]) => ({ label, revenue }))

  const peakTimeBuckets = HOUR_LABELS.map((label, hour) => ({
    label,
    count: peakTimeMap.get(hour) || 0,
  }))

  return {
    productRankings,
    customerRankings,
    orderRankings: normalizedOrderRankings,
    dailyRevenue,
    peakTimeBuckets,
  }
}

function normalizeOrder(order: ReportingOrder) {
  return {
    order_number: normalizeString(order?.order_number),
    client_account_no: normalizeString(order?.client_account_no),
    client_name: normalizeString(order?.client_name),
    total_amount: toNumber(order?.total_amount, 0),
    order_date: normalizeDateString(order?.order_date),
    payment_status: normalizeString(order?.payment_status) || 'Pending',
  }
}

function buildClientNameLookup(clients: ReportingClient[]) {
  const lookup = new Map<string, string>()

  for (const client of clients) {
    const accountNo = normalizeString(client?.account_no)
    if (!accountNo) continue

    const name =
      normalizeString(client?.client_name) ||
      normalizeString(client?.business_name) ||
      normalizeString(client?.full_name)

    if (name) {
      lookup.set(accountNo, name)
    }
  }

  return lookup
}

function resolveCustomerName(customerKey: string, orderClientName: string, lookup: Map<string, string>) {
  return normalizeString(orderClientName) || lookup.get(normalizeString(customerKey)) || normalizeString(customerKey) || 'Unknown'
}

function getOrderItems(order: ReportingOrder): ReportingOrderItem[] {
  const source = order?.order_items ?? order?.items ?? order?.orderItems ?? []
  if (Array.isArray(source)) return source
  return source ? [source] : []
}

function resolveSku(item: ReportingOrderItem) {
  return (
    normalizeString(item?.sku) ||
    normalizeString(extractProduct(item)?.sku) ||
    normalizeString(resolveProductTitle(item)) ||
    ''
  )
}

function resolveProductTitle(item: ReportingOrderItem, fallbackSku = '') {
  return (
    normalizeString(item?.title) ||
    normalizeString(extractProduct(item)?.title) ||
    fallbackSku ||
    'Unknown product'
  )
}

function extractProduct(item: ReportingOrderItem) {
  const product = item?.products
  if (Array.isArray(product)) {
    return product[0] || null
  }
  return product || null
}

function normalizeString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeDateString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  const raw = normalizeString(value)
  if (!raw) return ''

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString()
}

function getLocalDayKey(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLocalHour(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getHours()
}

function compareDateStringsDesc(a: string, b: string) {
  const aTime = Date.parse(a)
  const bTime = Date.parse(b)

  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
  if (Number.isNaN(aTime)) return 1
  if (Number.isNaN(bTime)) return -1
  return bTime - aTime
}
