const CART_STORAGE_KEY = 'kbc_cart_items'

export function parseCartItems(rawValue) {
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeCartItems(cartItems) {
  return JSON.stringify(cartItems)
}

export function addCartItem(cartItems, product) {
  const qty = 1
  const existingIndex = cartItems.findIndex((item) => item.id === product.id)

  if (existingIndex === -1) {
    return [
      ...cartItems,
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: Number(product.price),
        qty,
        inventory_quantity: product.inventory_quantity,
      },
    ]
  }

  const existingItem = cartItems[existingIndex]
  const stockLimit = Number(product.inventory_quantity || 0)

  if (stockLimit > 0 && existingItem.qty >= stockLimit) {
    return cartItems
  }

  const nextQty = existingItem.qty + qty
  const nextItem = {
    ...existingItem,
    qty: stockLimit > 0 ? Math.min(nextQty, stockLimit) : nextQty,
    inventory_quantity: product.inventory_quantity,
  }

  return cartItems.map((item, index) => (index === existingIndex ? nextItem : item))
}

export function getCartStorageKey() {
  return CART_STORAGE_KEY
}
