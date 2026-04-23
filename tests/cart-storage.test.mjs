import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartItem, parseCartItems, serializeCartItems } from '../lib/cart-storage.mjs'

test('addCartItem increments an existing product quantity without exceeding stock', () => {
  const current = [
    { id: 1, sku: 'ABC', name: 'Brake Shoe', price: 100, qty: 1, inventory_quantity: 5 },
  ]

  const next = addCartItem(current, {
    id: 1,
    sku: 'ABC',
    name: 'Brake Shoe',
    price: 100,
    inventory_quantity: 5,
  })

  assert.equal(next.length, 1)
  assert.equal(next[0].qty, 2)
  assert.equal(next[0].inventory_quantity, 5)
})

test('parseCartItems returns an empty array for invalid JSON', () => {
  assert.deepEqual(parseCartItems('not-json'), [])
})

test('serializeCartItems preserves cart data for session storage', () => {
  const cart = [
    { id: 2, sku: 'XYZ', name: 'Clutch Plate', price: 250, qty: 3, inventory_quantity: 10 },
  ]

  const parsed = parseCartItems(serializeCartItems(cart))
  assert.deepEqual(parsed, cart)
})
