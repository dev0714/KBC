'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1]">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-blue-500/30 bg-[#06123dcc]/90 text-white shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex h-[72px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <img src="/kbc-logo.png" alt="KBC" className="h-10 w-auto" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">Customer CRM</p>
              <h1 className="text-lg font-black leading-tight text-white">Shop Detail</h1>
            </div>
          </div>

          <Button asChild variant="outline" className="hidden border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/dashboard?tab=shop" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex pt-[72px]">
        <aside className="hidden md:fixed md:inset-y-[72px] md:left-0 md:flex md:w-64 md:flex-col border-r border-white/10 bg-[#06123d]/80 backdrop-blur-xl shadow-[12px_0_40px_rgba(0,0,0,0.18)]">
          <div className="border-b border-white/10 p-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-[0_16px_30px_rgba(0,0,0,0.18)]">
              <p className="mb-1.5 text-[11px] uppercase tracking-[0.35em] text-slate-400">Workspace</p>
              <h2 className="text-lg font-bold text-white">Customer CRM</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                Browse the product catalog and inspect each item without leaving the CRM workspace.
              </p>
            </div>
          </div>

          <nav className="flex-1 p-3.5">
            <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.45em] text-slate-500">Navigation</div>
            <div className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', href: '/dashboard', icon: '📊' },
                { id: 'shop', label: 'Shop Catalog', href: '/dashboard?tab=shop', icon: '🛍️' },
                { id: 'wishlist', label: 'Wishlist', href: '/dashboard?tab=wishlist', icon: '❤️' },
                { id: 'cart', label: 'Shopping Cart', href: '/dashboard?tab=cart', icon: '🛒' },
                { id: 'orders', label: 'Orders', href: '/dashboard?tab=orders', icon: '📦' },
                { id: 'documents', label: 'Documents', href: '/dashboard?tab=documents', icon: '📑' },
                { id: 'account', label: 'Account', href: '/dashboard?tab=account', icon: '⚙️' },
              ].map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-bold transition-all duration-300 ${
                    tab.id === 'shop'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tab.id === 'shop' ? 'bg-white/15' : 'bg-white/5'}`}>
                    {tab.icon}
                  </span>
                  <span className="flex-1">{tab.label}</span>
                  {tab.id === 'shop' && <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <main className="relative flex-1 md:ml-64 md:h-[calc(100vh-72px)] md:overflow-y-auto md:pb-6">
          <div className="mx-auto w-full max-w-[1700px] px-4 py-4 lg:px-8 lg:py-4">
            <div className="mb-3 flex flex-col gap-3 rounded-[22px] border border-white/10 bg-[#06123d]/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">Product Detail</p>
                <h2 className="mt-1.5 text-xl font-black text-white">{product?.title || 'Loading product'}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  CRM product view for quick gallery inspection and catalog navigation.
                </p>
              </div>

              <Button asChild className="bg-gradient-to-r from-red-600 to-red-700 font-bold text-white shadow-lg shadow-red-600/40 transition-all duration-300 hover:from-red-700 hover:to-red-800">
                <Link href="/dashboard?tab=shop" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Shop
                </Link>
              </Button>
            </div>

            <div className="mb-5 md:hidden">
              <Link href="/dashboard?tab=shop" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
              </Link>
            </div>

            {loading ? (
              <div className="flex h-[calc(100vh-220px)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-red-400" />
              </div>
            ) : error ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center backdrop-blur-xl">
                <p className="mb-2 text-lg font-bold text-red-300">Could not load product</p>
                <p className="text-sm text-red-100/80">{error}</p>
              </div>
            ) : product ? (
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#07163f]/95 via-[#0b2a5b]/95 to-[#102f73]/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-4">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-3">
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#102f73]/80 to-[#07163f]/95 shadow-[0_16px_40px_rgba(0,0,0,0.24)] xl:aspect-[16/11]">
                      {activeImage ? (
                        <img
                          src={activeImage}
                          alt={product.title}
                          className="h-full w-full bg-black/20 object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <div className="text-center">
                            <ImageIcon className="mx-auto mb-2 h-12 w-12 opacity-70" />
                            <p className="text-sm">No product image available</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2.5">
                        {images.map((img, index) => (
                          <button
                            key={`${img.url}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`aspect-square overflow-hidden rounded-xl border transition-all ${
                              index === activeImageIndex
                                ? 'border-red-400 ring-2 ring-red-400/40'
                                : 'border-white/10 hover:border-red-400/40'
                            }`}
                          >
                            <img
                              src={img.url || ''}
                              alt={`${product.title} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-red-300">SKU: {product.sku}</p>
                      <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.35em] text-slate-300">
                        CRM Detail
                      </p>
                    </div>

                    <h1 className="mb-2 text-3xl font-black text-white">{product.title}</h1>

                    <div className="mb-3 border-b border-white/10 pb-3">
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">R{Number(product.price || 0).toLocaleString()}</span>
                        <span className="text-sm text-slate-300">per unit</span>
                      </div>

                      {Number(product.inventory_quantity || 0) > 0 ? (
                        <span className="inline-flex rounded-full border border-green-500/50 bg-green-500/20 px-4 py-2 text-sm font-bold text-green-300">
                          In Stock - {product.inventory_quantity} available
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-bold text-red-300">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <p className="mb-4 whitespace-pre-line text-base leading-relaxed text-slate-300">
                      {product.description || 'No description available for this product.'}
                    </p>

                    <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                        <div className="text-sm">
                          <p className="font-bold text-white">Quality Guaranteed</p>
                          <p className="text-slate-300">Manufactured and stored with care</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Truck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300" />
                        <div className="text-sm">
                          <p className="font-bold text-white">Fast Dispatch</p>
                          <p className="text-slate-300">Prepared for shipping after order confirmation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-300" />
                        <div className="text-sm">
                          <p className="font-bold text-white">Product Support</p>
                          <p className="text-slate-300">Contact us if you need help choosing the right part</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-10 gap-2 border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 hover:text-white">
                        <Download className="h-4 w-4" />
                        Datasheet
                      </Button>
                      <Button variant="outline" className="h-10 gap-2 border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 hover:text-white">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                      <Button variant="outline" className="h-10 gap-2 border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 hover:text-white">
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Button>
                      <Button className="h-10 gap-2 bg-gradient-to-r from-red-600 to-red-700 text-sm font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-red-800">
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-3 md:block">
                    <div className="flex gap-3">
                      {images.map((img, index) => (
                        <button
                          key={`${img.url}-bottom-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                            index === activeImageIndex
                              ? 'border-red-400 ring-2 ring-red-400/40'
                              : 'border-white/10 hover:border-red-400/40'
                          }`}
                        >
                          <img
                            src={img.url || ''}
                            alt={`${product.title} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
