import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Simple query - just count rows in each table
    const { data: clients, error: clientsErr } = await supabase.from('clients').select('account_no')
    const { data: products, error: productsErr } = await supabase.from('products').select('sku')
    const { data: orders, error: ordersErr } = await supabase.from('orders').select('order_number')
    const { data: quotes, error: quotesErr } = await supabase.from('quotes').select('quote_number')
    const { data: documents, error: docsErr } = await supabase.from('documents').select('id')
    const { data: orderItems, error: oiErr } = await supabase.from('order_items').select('id')
    const { data: quoteItems, error: qiErr } = await supabase.from('quote_items').select('id')
    const { data: productImages, error: piErr } = await supabase.from('product_images').select('id')

    console.log('[v0] DB Test - clients:', clients?.length, clientsErr?.message)
    console.log('[v0] DB Test - products:', products?.length, productsErr?.message)
    console.log('[v0] DB Test - orders:', orders?.length, ordersErr?.message)
    console.log('[v0] DB Test - quotes:', quotes?.length, quotesErr?.message)
    console.log('[v0] DB Test - documents:', documents?.length, docsErr?.message)
    console.log('[v0] DB Test - order_items:', orderItems?.length, oiErr?.message)
    console.log('[v0] DB Test - quote_items:', quoteItems?.length, qiErr?.message)
    console.log('[v0] DB Test - product_images:', productImages?.length, piErr?.message)

    return NextResponse.json({
      clients: { count: clients?.length || 0, error: clientsErr?.message },
      products: { count: products?.length || 0, error: productsErr?.message },
      orders: { count: orders?.length || 0, error: ordersErr?.message },
      quotes: { count: quotes?.length || 0, error: quotesErr?.message },
      documents: { count: documents?.length || 0, error: docsErr?.message },
      order_items: { count: orderItems?.length || 0, error: oiErr?.message },
      quote_items: { count: quoteItems?.length || 0, error: qiErr?.message },
      product_images: { count: productImages?.length || 0, error: piErr?.message },
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    })
  } catch (err: any) {
    console.log('[v0] DB Test - caught error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
