import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const search = searchParams.get('search')?.trim() || ''

    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query with product_images join
    let query = supabase
      .from('products')
      .select('*, product_images(file_name, storage_path, is_primary)', { count: 'exact' })
      .order('title', { ascending: true })

    // Add search filter if provided
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`
      )
    }

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw new Error(`Products query failed: ${error.message}`)

    // Extract primary image for each product
    const productsWithImages = data?.map(product => {
      const primaryImage = product.product_images?.find((img: any) => img.is_primary)
      const imageUrl = primaryImage?.storage_path
        ? supabase.storage.from('product-images').getPublicUrl(primaryImage.storage_path).data.publicUrl
        : null

      return {
        ...product,
        image_url: imageUrl,
        product_images: undefined
      }
    }) || []

    return NextResponse.json({
      products: productsWithImages,
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error('[v0] Products API error:', error)
    return NextResponse.json(
      {
        products: [],
        total: 0,
        page: 1,
        limit: 50,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
