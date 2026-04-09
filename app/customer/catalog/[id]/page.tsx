'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Download, Heart, Share2, ShoppingCart, Shield, Truck, Loader2, ImageIcon } from 'lucide-react'

type ProductImage = {
  file_name?: string | null
  storage_path?: string | null
  is_primary?: boolean | null
  sort_order?: number | null
  url?: string | null
}

type Product = {
  id: number
  sku: string
  title: string
  product_type?: string | null
  description?: string | null
  price?: number | string | null
  inventory_quantity?: number | null
  image_url?: string | null
  product_images?: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams<{ id?: string | string[] }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const productId = useMemo(() => {
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
    if (!rawId || rawId === 'undefined' || rawId === 'null') return null
    return rawId
  }, [params])

  useEffect(() => {
    if (!productId) {
      setError('Invalid product link')
      setLoading(false)
      return
    }

    const loadProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/products?id=${encodeURIComponent(productId)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load product')
        }

        if (!data.product) {
          throw new Error('Product not found')
        }

        setProduct(data.product)
        setActiveImageIndex(0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const images = useMemo(() => {
    const productImages = product?.product_images?.filter((img) => img.url) || []
    if (productImages.length > 0) return productImages
    if (product?.image_url) {
      return [{ url: product.image_url, file_name: product.title, is_primary: true }]
    }
    return []
  }, [product])

  const activeImage = images[activeImageIndex]?.url || product?.image_url || ''

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/customer/catalog" className="hover:text-secondary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-secondary animate-spin" />
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
              <p className="text-lg font-bold text-red-300 mb-2">Could not load product</p>
              <p className="text-sm text-red-100/80">{error}</p>
            </div>
          ) : product ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                <div className="space-y-4">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/20 to-secondary/10 shadow-xl shadow-secondary/10">
                    {activeImage ? (
                      <img
                        src={activeImage}
                        alt={product.title}
                        className="w-full h-full object-contain bg-black/20"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-70" />
                          <p className="text-sm">No product image available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((img, index) => (
                        <button
                          key={`${img.url}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                            index === activeImageIndex
                              ? 'border-secondary ring-2 ring-secondary/40'
                              : 'border-primary/20 hover:border-secondary/40'
                          }`}
                        >
                          <img
                            src={img.url || ''}
                            alt={`${product.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <p className="text-sm text-secondary font-bold mb-2">SKU: {product.sku}</p>
                  <h1 className="text-4xl font-bold mb-4 text-foreground">{product.title}</h1>

                  <div className="mb-6 pb-6 border-b border-primary/20">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-foreground">R{Number(product.price || 0).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">per unit</span>
                    </div>

                    {Number(product.inventory_quantity || 0) > 0 ? (
                      <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/50">
                        In Stock - {product.inventory_quantity} available
                      </span>
                    ) : (
                      <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/50">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <p className="text-lg text-muted-foreground mb-8 whitespace-pre-line">
                    {product.description || 'No description available for this product.'}
                  </p>

                  <div className="space-y-3 p-6 bg-card border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-foreground">Quality Guaranteed</p>
                        <p className="text-muted-foreground">Manufactured and stored with care</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-foreground">Fast Dispatch</p>
                        <p className="text-muted-foreground">Prepared for shipping after order confirmation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-foreground">Product Support</p>
                        <p className="text-muted-foreground">Contact us if you need help choosing the right part</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-primary/20 pt-8 flex flex-wrap gap-4 justify-center">
                <Button variant="outline" className="border-primary/30 hover:border-secondary/50 gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Download Datasheet
                </Button>
                <Button variant="outline" className="border-primary/30 hover:border-secondary/50 gap-2 bg-transparent">
                  <Share2 className="w-4 h-4" />
                  Share Product
                </Button>
                <Button variant="outline" className="border-primary/30 hover:border-secondary/50 gap-2 bg-transparent">
                  <Heart className="w-4 h-4" />
                  Add to Wishlist
                </Button>
                <Button className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-bold gap-2 shadow-lg shadow-secondary/30">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}
