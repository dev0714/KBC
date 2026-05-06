export function buildPayFastPaymentPayload({
  accountNo,
  orderNumber,
  orderId,
  amount,
  itemCount,
  customer,
  source = 'customer',
}) {
  const [nameFirst = 'Customer', ...nameParts] = (customer?.fullName || '').trim().split(/\s+/).filter(Boolean)
  const nameLast = nameParts.join(' ')

  return {
    id: 2,
    client_id: String(accountNo),
    amount: Number(amount).toFixed(2),
    item_name: `Order ${orderNumber}`,
    item_description: `KBC Order - ${itemCount} items`,
    custom_str1: String(orderId),
    order_number: String(orderNumber),
    custom_int1: '1',
    source,
    name_first: nameFirst,
    name_last: nameLast,
    email_address: customer?.email || '',
    cell_number: customer?.phone || '',
  }
}
