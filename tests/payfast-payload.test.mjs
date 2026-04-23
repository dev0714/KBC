import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPayFastPaymentPayload } from '../lib/payfast-payment.mjs'

test('buildPayFastPaymentPayload uses the session account number as client_id', () => {
  const payload = buildPayFastPaymentPayload({
    accountNo: 'MCT-001',
    orderNumber: 'ORD-123',
    orderId: 42,
    amount: 304.75,
    itemCount: 3,
    customer: {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+27 11 123 4567',
    },
  })

  assert.equal(payload.id, 1)
  assert.equal(payload.client_id, 'MCT-001')
  assert.equal(payload.amount, '304.75')
  assert.equal(payload.item_name, 'Order ORD-123')
  assert.equal(payload.custom_str1, '42')
  assert.equal(payload.name_first, 'Jane')
  assert.equal(payload.name_last, 'Doe')
})
