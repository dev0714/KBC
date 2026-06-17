import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// GET    -> primary images, optionally filtered to ?skus=a,b,c
// POST   -> insert image metadata rows { images: [...] }
// DELETE -> remove a single image row { product_sku, storage_path }

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const skusParam = request.nextUrl.searchParams.get('skus')
  const supabase = createServiceClient()

  let query = supabase
    .from('product_images')
    .select('product_sku, storage_path')
    .eq('is_primary', true)

  if (skusParam) {
    const skus = skusParam.split(',').map((s) => s.trim()).filter(Boolean)
    query = query.in('product_sku', skus)
  }

  const { data, error } = await query
  if (error) {
    console.error('[product-images] GET error:', error)
    return NextResponse.json({ error: 'Failed to load images' }, { status: 500 })
  }

  return NextResponse.json({ images: data || [] })
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { images } = await request.json()
  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'images array is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('product_images').insert(images)

  if (error) {
    console.error('[product-images] POST error:', error)
    return NextResponse.json({ error: 'Failed to save image records' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { product_sku, storage_path } = await request.json()
  if (!product_sku || !storage_path) {
    return NextResponse.json({ error: 'product_sku and storage_path are required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('product_sku', product_sku)
    .eq('storage_path', storage_path)

  if (error) {
    console.error('[product-images] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
