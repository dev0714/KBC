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

assert.equal(model.orderRankings[0].order_number, 'ORD-2')
assert.equal(model.customerRankings[0].account_no, 'MID002')
assert.equal(model.productRankings[0].sku, 'SKU-B')
assert.equal(model.dailyRevenue[0].revenue, 800)
assert.equal(model.peakTimeBuckets.find((bucket) => bucket.label === '5 PM')?.count, 1)

console.log('reporting smoke test passed')
