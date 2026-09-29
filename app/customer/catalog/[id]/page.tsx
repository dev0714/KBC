'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { PortalShell } from '@/components/portal/shell'
import { StockLabel, btn, card, formatRand } from '@/components/portal/ui'
import { addCartItem, getCartStorageKey, parseCartItems, serializeCartItems } from '@/lib/cart-storage.mjs'
import { AlertCircle, ArrowLeft, CheckCircle2, Heart, ImageIcon, Loader2, Mail, Phone, Share2, ShoppingCart } from 'lucide-react'

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

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null))

export default function ProductDetailPage() {
  const params = useParams<{ id?: string | string[] }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartUnits, setCartUnits] = useState(0)
  const [saved, setSaved] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)

  const { data: dash } = useSWR('/api/dashboard', fetcher)
  const { data: wishlist, mutate: mutateWishlist } = useSWR('/api/dashboard/wishlists', fetcher)
  const client = dash?.client
  const displayName = client?.business_name || client?.client_name || client?.full_name
  const wishlistSkus: string[] = wishlist?.skus || []

  const refreshCartUnits = () => {
    const items = parseCartItems(sessionStorage.getItem(getCartStorageKey()))
    setCartUnits(items.reduce((sum: number, item: { qty: number }) => sum + item.qty, 0))
  }
  useEffect(refreshCartUnits, [])
  useEffect(() => {
    if (product) setSaved(wishlistSkus.includes(product.sku))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, wishlist])

  const toggleWishlist = async () => {
    if (!product) return
    setSavingWishlist(true)
    try {
      const res = await fetch('/api/dashboard/wishlists', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: product.sku }),
      })
      if (res.ok) {
        setSaved(!saved)
        mutateWishlist()
      }
    } finally {
      setSavingWishlist(false)
    }
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareMessage('Link copied')
    } catch {
      window.prompt('Copy this link', url)
      return
    }
    window.setTimeout(() => setShareMessage(null), 2000)
  }


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

  const showCartMessage = (message: string) => {
    setCartMessage(message)
    window.setTimeout(() => setCartMessage(null), 2500)
  }

  const handleAddToCart = () => {
    if (!product) return

    const availableStock = Number(product.inventory_quantity || 0)
    if (availableStock <= 0) {
      showCartMessage('This product is out of stock.')
      return
    }

    setAddingToCart(true)
    try {
      const storedCart = parseCartItems(sessionStorage.getItem(getCartStorageKey()))
      const existingItem = storedCart.find((item) => item.id === product.id)
      const nextCart = addCartItem(storedCart, {
        id: product.id,
        sku: product.sku,
        name: product.title,
        price: Number(product.price || 0),
        inventory_quantity: availableStock,
      })

      sessionStorage.setItem(getCartStorageKey(), serializeCartItems(nextCart))

      const updatedItem = nextCart.find((item: { id: number; qty: number }) => item.id === product.id)
      if (existingItem && updatedItem && updatedItem.qty === existingItem.qty) {
        showCartMessage(`Only ${availableStock} units available.`)
        return
      }

      refreshCartUnits()
      showCartMessage(`${product.title} added to your cart.`)
    } finally {
      setAddingToCart(false)
    }
  }

  const stock = Number(product?.inventory_quantity || 0)

  return (
    <PortalShell
      active="shop"
      crumb="Shop catalog"
      displayName={displayName}
      accountNumber={client?.account_no}
      cartUnits={cartUnits}
      wishlistCount={wishlistSkus.length}
    >
      <Link href="/dashboard?tab=shop" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1D3A8A] hover:text-[#132A6B]">
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </Link>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F1B3D]" />
        </div>
      ) : error ? (
        <section className={`${card} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEA] text-[#A4161A]">
            <AlertCircle className="h-5 w-5" />
          </span>
          <p className="text-[15px] font-semibold">This part could not be loaded</p>
          <p className="max-w-sm text-sm text-[#5A6272]">{error}</p>
          <Link href="/dashboard?tab=shop" className={btn.primary}>
            Back to catalog
          </Link>
        </section>
      ) : product ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="flex flex-col gap-3">
            <div className={`${card} aspect-[4/3] overflow-hidden`}>
              {activeImage ? (
                <img src={activeImage} alt={product.title} className="h-full w-full bg-white object-contain" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#EEF0F3] text-[#8A919E]">
                  <ImageIcon className="h-10 w-10" />
                  <span className="text-sm">No photo available</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5">
                {images.map((img, index) => (
                  <button
                    key={`${img.url}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-pressed={index === activeImageIndex}
                    className={`aspect-square overflow-hidden rounded-md border bg-white ${
                      index === activeImageIndex ? 'border-[#0F1B3D] ring-2 ring-[#0F1B3D]/20' : 'border-[#E3E6EC] hover:border-[#9AA3B2]'
                    }`}
                  >
                    <img src={img.url || ''} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <div className={`${card} flex flex-col gap-4 p-6`}>
              <div className="flex flex-col gap-2">
                {product.product_type && <span className="text-[13px] text-[#5A6272]">{product.product_type}</span>}
                <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight">{product.title}</h1>
                <span className="kbc-mono text-[13px] text-[#5A6272]">SKU {product.sku}</span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3 border-y border-[#EEF0F3] py-4">
                <div className="flex flex-col gap-1">
                  <span className="kbc-mono text-[28px] font-medium leading-none">{formatRand(product.price)}</span>
                  <span className="text-xs text-[#5A6272]">per unit</span>
                </div>
                <StockLabel qty={stock} />
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:flex">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || stock <= 0}
                  className={`${btn.navy} col-span-2 h-11 px-5 text-[15px] sm:flex-1`}
                >
                  {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  {stock <= 0 ? 'Out of stock' : addingToCart ? 'Adding…' : 'Add to cart'}
                </button>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={savingWishlist}
                  aria-pressed={saved}
                  className={`${btn.secondary} h-11`}
                >
                  <Heart className={`h-4 w-4 ${saved ? 'fill-[#C8102E] text-[#C8102E]' : ''}`} />
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button type="button" onClick={share} className={`${btn.secondary} h-11`}>
                  <Share2 className="h-4 w-4" /> {shareMessage || 'Share'}
                </button>
              </div>
              {cartMessage && (
                <p role="status" className="flex items-center gap-2 rounded-md bg-[#E7F4EE] px-3.5 py-2.5 text-sm font-medium text-[#0B6B41]">
                  <CheckCircle2 className="h-4 w-4" />
                  {cartMessage}{' '}
                  <Link href="/dashboard?tab=cart" className="ml-auto underline">
                    View cart
                  </Link>
                </p>
              )}
            </div>

            <div className={`${card} flex flex-col gap-2 p-6`}>
              <h2 className="kbc-display text-[17px] font-semibold">Description</h2>
              <p className="whitespace-pre-line text-sm leading-[22px] text-[#3D4452]">
                {product.description || 'No description has been added for this part yet.'}
              </p>
            </div>

            <div className={`${card} flex flex-col gap-2.5 p-6`}>
              <h2 className="kbc-display text-[17px] font-semibold">Need help choosing a part?</h2>
              <p className="text-sm text-[#5A6272]">Our sales desk can confirm fitment and availability.</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <a href="tel:+27114931336" className="flex items-center gap-2 text-sm text-[#1D3A8A] hover:underline">
                  <Phone className="h-4 w-4" />
                  <span className="kbc-mono">011 493 1336</span>
                </a>
                <a
                  href={`mailto:kbc1@telkomsa.net?subject=${encodeURIComponent(`Enquiry: ${product.sku} ${product.title}`)}`}
                  className="flex items-center gap-2 text-sm text-[#1D3A8A] hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  kbc1@telkomsa.net
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </PortalShell>
  )
}
