import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function resolveImageUrl(supabase: ReturnType<typeof createClient>, storagePath: string | null | undefined) {
  if (!storagePath) return null

  const trimmedPath = storagePath.trim()
  if (!trimmedPath) return null

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath
  }

  return supabase.storage.from('product-images').getPublicUrl(trimmedPath).data.publicUrl
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const search = searchParams.get('search')?.trim() || ''
    const productId = searchParams.get('id')?.trim()

    // Calculate range for pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query with product_images join
    let query = supabase
      .from('products')
      .select('*, product_images(file_name, storage_path, is_primary, sort_order)', { count: 'exact' })
      .order('title', { ascending: true })

    if (productId) {
      query = query.eq('id', productId)
    }

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

    const normalizeProduct = (product: any) => {
      const images = (product.product_images || [])
        .map((img: any) => ({
          file_name: img.file_name,
          storage_path: img.storage_path,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
          url: resolveImageUrl(supabase, img.storage_path),
        }))
        .filter((img: any) => !!img.url)
        .sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return (a.sort_order || 0) - (b.sort_order || 0)
        })

      const primaryImage = images.find((img: any) => img.is_primary) || images[0] || null

      return {
        ...product,
        image_url: primaryImage?.url || null,
        product_images: images,
      }
    }

    const productsWithImages = data?.map(normalizeProduct) || []

    if (productId) {
      return NextResponse.json({
        product: productsWithImages[0] || null,
        total: productsWithImages.length,
        page,
        limit,
      })
    }

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
