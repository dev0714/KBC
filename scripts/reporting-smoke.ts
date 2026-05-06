import assert from 'node:assert/strict'
import { buildReportingModel } from '../lib/admin/reporting.ts'

const model = buildReportingModel({
  orders: [
    {
      order_number: 'ORD-1',
      client_account_no: 'MID001',
      client_name: 'Alpha',
      total_amount: 300,
      order_date: '2026-05-06T09:15:00Z',
      payment_status: 'Paid',
      order_items: [
        {
          sku: 'SKU-A',
          quantity: 3,
          price: 100,
          products: { title: 'Product A' },
        },
      ],
    },
    {
      order_number: 'ORD-2',
      client_account_no: 'MID002',
      client_name: 'Beta',
      total_amount: 500,
      order_date: '2026-05-06T17:15:00Z',
      payment_status: 'Cancelled',
      order_items: [
        {
          sku: 'SKU-B',
          quantity: 5,
          price: 100,
          products: { title: 'Product B' },
        },
      ],
    },
  ],
  clients: [
    { account_no: 'MID001', client_name: 'Alpha' },
    { account_no: 'MID002', client_name: 'Beta' },
  ],
})

assert.deepEqual(Object.keys(model).sort(), [
  'customerRankings',
  'dailyRevenue',
  'orderRankings',
  'peakTimeBuckets',
  'productRankings',
])
assert.deepEqual(model.productRankings, [
  { sku: 'SKU-B', title: 'Product B', unitsSold: 5, revenue: 500 },
  { sku: 'SKU-A', title: 'Product A', unitsSold: 3, revenue: 300 },
])
assert.deepEqual(model.customerRankings, [
  { account_no: 'MID002', client_name: 'Beta', orderCount: 1, totalSpend: 500 },
  { account_no: 'MID001', client_name: 'Alpha', orderCount: 1, totalSpend: 300 },
])
assert.deepEqual(model.orderRankings, [
  {
    order_number: 'ORD-2',
    client_name: 'Beta',
    total_amount: 500,
    order_date: '2026-05-06T17:15:00.000Z',
    payment_status: 'Cancelled',
  },
  {
    order_number: 'ORD-1',
    client_name: 'Alpha',
    total_amount: 300,
    order_date: '2026-05-06T09:15:00.000Z',
    payment_status: 'Paid',
  },
])
assert.deepEqual(model.dailyRevenue, [
  { label: '2026-05-06', revenue: 800 },
])
assert.equal(model.peakTimeBuckets.length, 24)
assert.deepEqual(
  model.peakTimeBuckets.map((bucket) => bucket.label),
  [
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
)
assert.deepEqual(
  model.peakTimeBuckets.map((bucket) => bucket.count),
  [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0]
)

const sparseModel = buildReportingModel({
  orders: [
    {
      order_number: 'ORD-3',
      client_name: 'NoAcct',
      total_amount: 50,
      order_date: '2026-05-07T00:00:00Z',
      payment_status: 'Pending',
    },
    {
      order_number: 'ORD-4',
      total_amount: 75,
      order_date: '2026-05-07T01:00:00Z',
      payment_status: 'Paid',
    },
    {
      order_number: 'ORD-5',
      total_amount: 75,
      order_date: '2026-05-07T02:00:00Z',
      payment_status: 'Cancelled',
    },
  ],
  clients: [],
})

assert.deepEqual(sparseModel.customerRankings, [
  { account_no: '', client_name: 'Unknown', orderCount: 2, totalSpend: 150 },
  { account_no: '', client_name: 'NoAcct', orderCount: 1, totalSpend: 50 },
])
assert.deepEqual(sparseModel.productRankings, [])
assert.deepEqual(sparseModel.dailyRevenue, [{ label: '2026-05-07', revenue: 200 }])

console.log('reporting smoke test passed')
