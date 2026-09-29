'use client'

import React, { Suspense } from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { buildPayFastPaymentPayload } from '@/lib/payfast-payment.mjs'
import { getCartStorageKey, parseCartItems, serializeCartItems } from '@/lib/cart-storage.mjs'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Upload,
  User,
  X,
} from 'lucide-react'
import { portalFontVars } from '@/components/portal/fonts'
import {
  EmptyState,
  PageHead,
  SectionHead,
  StatusPill,
  StockLabel,
  btn,
  card,
  formatBytes,
  formatDate,
  formatRand,
  iconBtn,
  input,
  td,
  th,
} from '@/components/portal/ui'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function DashboardTabSync({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (!tab) return

    const allowedTabs = new Set(['overview', 'shop', 'wishlist', 'cart', 'orders', 'documents', 'account'])
    if (allowedTabs.has(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams, setActiveTab])

  return null
}

export default function DashboardPage() {
  const [accountNo, setAccountNo] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingAccountNo, setLoadingAccountNo] = useState(true)

  const { data: dashData, error: dashError, isLoading: dashLoading, mutate: mutateDashboard } = useSWR(accountNo ? '/api/dashboard' : null, fetcher)

  const [activeTab, setActiveTab] = useState('overview')
  const [cart, setCart] = useState<Array<{id: number; sku: string; name: string; price: number; qty: number; inventory_quantity?: number}>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [productQuantities, setProductQuantities] = useState<{[key: number]: number}>({})
  const [stockErrors, setStockErrors] = useState<{[key: number]: string}>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  
  // Pagination and search state
  const [products, setProducts] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [prodLoading, setProdLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set())
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadDocumentError, setUploadDocumentError] = useState<string | null>(null)
    const [selectedDocumentType, setSelectedDocumentType] = useState('Invoice')
    const [editFormData, setEditFormData] = useState({
      email: '',
      full_name: '',
      phone_number: '',
      business_type: '',
      address: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [cartReady, setCartReady] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'credit'>('payfast')
  const [orderFilter, setOrderFilter] = useState('All')
  const [orderSearch, setOrderSearch] = useState('')
  const [docFilter, setDocFilter] = useState('All')
  const [topSearch, setTopSearch] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const client = dashData?.client
  const displayName = client?.business_name || client?.client_name || client?.full_name || 'Customer'
  const orders = dashData?.orders || []
  const quotes = dashData?.quotes || []
  const documents = dashData?.documents || []
  const stats = dashData?.stats || { totalOrders: 0, activeQuotes: 0, totalSpent: 0 }


  useEffect(() => {
    const storedCart = parseCartItems(sessionStorage.getItem(getCartStorageKey()))
    setCart(storedCart)
    setCartReady(true)
  }, [])

  useEffect(() => {
    if (!cartReady) return
    sessionStorage.setItem(getCartStorageKey(), serializeCartItems(cart))
  }, [cart, cartReady])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('[v0] Logout error:', error)
    }
    window.location.href = '/login'
  }

  // Fetch initial products
  useEffect(() => {
    const fetchProducts = async () => {
      setProdLoading(true)
      try {
        const params = new URLSearchParams({ page: '1', limit: '50' })
        if (searchQuery) params.append('search', searchQuery)
        
        const response = await fetch(`/api/products?${params}`)
        const data = await response.json()
        
        setProducts(data.products || [])
        setTotalProducts(data.total || 0)
        setCurrentPage(1)
        setHasMore((data.products || []).length >= 50)
      } catch (error) {
        console.error('[v0] Error fetching products:', error)
      } finally {
        setProdLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery])

  // Load more products
  const loadMoreProducts = async () => {
    setProdLoading(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams({ page: String(nextPage), limit: '50' })
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      setProducts(prev => [...prev, ...(data.products || [])])
      setCurrentPage(nextPage)
      setHasMore((data.products || []).length >= 50)
    } catch (error) {
      console.error('[v0] Error loading more products:', error)
    } finally {
      setProdLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])
  useEffect(() => {
    const fetchAccountNo = async () => {
      try {
        const response = await fetch('/api/auth/session')
        
        if (!response.ok) {
          window.location.href = '/login'
          return
        }

        const data = await response.json()
        if (!data.business_id || !data.id) {
          window.location.href = '/login'
          return
        }

        setAccountNo(data.business_id)
        setUserId(data.id)
      } catch (error) {
        console.error('[v0] Error in fetchAccountNo:', error)
        window.location.href = '/login'
      } finally {
        setLoadingAccountNo(false)
      }
    }

    fetchAccountNo()
  }, [])

  // Force refresh dashboard data when coming from payment pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('refresh')) {
      console.log('[v0] Refreshing dashboard data after payment')
      mutateDashboard()
      // Clean up the URL to remove the refresh param
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [mutateDashboard])

  // Update edit form when entering edit mode or when client data changes
  useEffect(() => {
      if (client) {
        setEditFormData({
          email: client.email || '',
          full_name: client.full_name || '',
          phone_number: client.phone_number || '',
          business_type: client.business_type || '',
          address: client.address || ''
      })
    }
  }, [client])

  const handleUploadDocument = async (file: File) => {
    setUploadingDocument(true)
    setUploadDocumentError(null)
    try {
      const supabase = createClient()
      const accountNo = client?.account_no
      
      if (!accountNo) {
        setUploadDocumentError('Account number not found')
        return
      }

      const filePath = `${accountNo}/${Date.now()}_${file.name}`

      // Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        console.error('[v0] Document upload error:', uploadError)
        setUploadDocumentError('Failed to upload document')
        return
      }

      // Get public URL
      const { data } = supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath)

      // Insert into documents table (server-side; account is taken from session)
      const insertResponse = await fetch('/api/dashboard/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          storage_path: data.publicUrl,
          document_type: selectedDocumentType,
          file_size: file.size,
        }),
      })

      if (!insertResponse.ok) {
        console.error('[v0] Document insert failed:', await insertResponse.text())
        setUploadDocumentError('Failed to save document record')
        return
      }

      console.log('[v0] Document upload successful:', { accountNo, fileName: file.name, documentType: selectedDocumentType })

      // Refresh dashboard data to show new document
      mutateDashboard()
      
      // Close modal
      setShowUploadModal(false)
      setSelectedDocumentType('Invoice')
    } catch (err) {
      console.error('[v0] Error in handleUploadDocument:', err)
      setUploadDocumentError('An error occurred during upload')
    } finally {
      setUploadingDocument(false)
    }
  }

  // Fetch wishlists from Supabase when accountNo is ready
  useEffect(() => {
    if (!accountNo) return

    const fetchWishlists = async () => {
      try {
        const response = await fetch('/api/dashboard/wishlists')
        if (!response.ok) {
          console.error('[v0] Error fetching wishlists:', await response.text())
          setFavoritesLoading(false)
          return
        }

        const { skus: skuList } = await response.json()
        setFavorites(new Set<string>(skuList || []))
      } catch (error) {
        console.error('[v0] Error in fetchWishlists:', error)
      } finally {
        setFavoritesLoading(false)
      }
    }
    
    fetchWishlists()
  }, [accountNo])

  const toggleFavorite = async (sku: string) => {
    const newFavorites = new Set(favorites)

    try {
      if (newFavorites.has(sku)) {
        // Remove from wishlist
        newFavorites.delete(sku)
        const response = await fetch('/api/dashboard/wishlists', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku }),
        })

        if (!response.ok) {
          console.error('[v0] Error removing from wishlist:', await response.text())
          return
        }
      } else {
        // Add to wishlist
        newFavorites.add(sku)
        const response = await fetch('/api/dashboard/wishlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku }),
        })

        if (!response.ok) {
          console.error('[v0] Error adding to wishlist:', await response.text())
          return
        }
      }

      setFavorites(newFavorites)
    } catch (error) {
      console.error('[v0] Error toggling favorite:', error)
    }
  }

  const addToCart = (product: {id: number; sku: string; name: string; price: number; inventory_quantity?: number}) => {
    // Check if product has stock
    if (!product.inventory_quantity || product.inventory_quantity === 0) {
      setStockErrors(prev => ({...prev, [product.id]: 'This product is out of stock'}))
      return
    }

    const qty = productQuantities[product.id] || 1
    
    // Check if quantity exceeds available stock
    if (qty > product.inventory_quantity) {
      setStockErrors(prev => ({...prev, [product.id]: `Only ${product.inventory_quantity} units available`}))
      return
    }
    
    // Clear any existing error for this product
    setStockErrors(prev => {
      const newErrors = {...prev}
      delete newErrors[product.id]
      return newErrors
    })

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        const newQty = existing.qty + qty
        if (newQty > (product.inventory_quantity || 0)) {
          setStockErrors(prevErr => ({...prevErr, [product.id]: `Only ${product.inventory_quantity} units available`}))
          return prev
        }
        return prev.map(item => item.id === product.id ? {...item, qty: newQty, inventory_quantity: product.inventory_quantity} : item)
      }
      return [...prev, {...product, qty, inventory_quantity: product.inventory_quantity}]
    })
    setProductQuantities(prev => ({...prev, [product.id]: 1}))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const handleSaveProfile = async () => {
    if (!client || !userId) return
    
    setSavingProfile(true)
    try {
      const response = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editFormData.full_name || null,
          email: editFormData.email || null,
          phone_number: editFormData.phone_number || null,
          business_type: editFormData.business_type || null,
        }),
      })

      if (!response.ok) {
        console.error('[v0] Error updating profile:', await response.text())
        alert('Error updating profile. Please try again.')
        return
      }

      await mutateDashboard()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err) {
      console.error('[v0] Error in handleSaveProfile:', err)
      alert('An error occurred while saving your profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    // Validate inputs
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      setPasswordError('Please fill in all password fields')
      return
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordFormData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    setUpdatingPassword(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }

      setPasswordSuccess('Password updated successfully')
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (err) {
      console.error('[v0] Error in handleChangePassword:', err)
      setPasswordError('An error occurred. Please try again.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handlePlaceOrder = async (paymentMethod: 'payfast' | 'credit') => {
    if (cart.length === 0) return
    const pendingOrder = { items: cart, total: cartTotal }
    
    setSubmittingOrder(true)
    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          total: pendingOrder.total,
          items: pendingOrder.items,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        console.error('[v0] Error inserting order:', orderData)
        throw new Error(orderData.details || orderData.error || 'Failed to create order')
      }

      console.log('[v0] Order inserted successfully:', orderData)
      const orderNumber = orderData.order?.order_number
      const createdOrderId = orderData.order?.id
      
      // If PayFast payment, redirect to payment gateway
      if (paymentMethod === 'payfast') {
        try {
            const paymentClientId = accountNo || client?.account_no
            if (!paymentClientId) {
              throw new Error('Business ID not found in session')
            }

            const response = await fetch('/api/payfast/create-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                buildPayFastPaymentPayload({
                  accountNo: paymentClientId,
                  orderNumber: orderNumber || '',
                  orderId: createdOrderId || orderNumber || '',
                  amount: pendingOrder.total,
                  itemCount: pendingOrder.items.length,
                  source: 'customer',
                  customer: {
                    fullName: client?.full_name || client?.client_name || 'Customer',
                    email: client?.email || '',
                    phone: client?.phone_number || '',
                  },
                })
              )
            })
          
          const paymentData = await response.json()
          console.log('[v0] Payment API response:', { status: response.status, hasUrl: !!paymentData.url, error: paymentData.error })
          
          if (!response.ok) {
            throw new Error(paymentData.error || paymentData.details || `HTTP ${response.status}`)
          }
          
          if (paymentData.url) {
              document.cookie = `kbc_pending_order_id=${encodeURIComponent(String(createdOrderId))}; path=/; max-age=3600; samesite=lax`
              document.cookie = `kbc_pending_order_number=${encodeURIComponent(String(orderNumber))}; path=/; max-age=3600; samesite=lax`
              document.cookie = `kbc_pending_payment_method=payfast; path=/; max-age=3600; samesite=lax`
              sessionStorage.setItem('kbc_pending_order_id', String(createdOrderId))
              sessionStorage.setItem('kbc_pending_order_number', String(orderNumber))
              sessionStorage.setItem('kbc_pending_payment_method', 'payfast')
              window.location.href = paymentData.url
            } else {
              throw new Error('Failed to generate payment URL')
            }
        } catch (paymentError) {
          console.error('[v0] PayFast error:', paymentError)
          const errorMessage = paymentError instanceof Error ? paymentError.message : String(paymentError)
          alert(`Payment gateway error: ${errorMessage}`)
          setSubmittingOrder(false)
          return
        }
      } else {
        // For credit payment (pending), just show success
        mutateDashboard()
        setCart([])
        setOrderSubmitted(true)
        setTimeout(() => setOrderSubmitted(false), 3000)
        setActiveTab('orders')
      }
    } catch (error) {
      console.error('[v0] Order placement failed:', error)
      alert('Failed to place order. Please try again.')
      setSubmittingOrder(false)
    }
  }

  if (loadingAccountNo || dashLoading) {
    return (
      <div className={`kbc-portal ${portalFontVars} flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F4F5F7]`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#0F1B3D]" />
        <p className="text-sm font-medium text-[#5A6272]">Loading your account…</p>
      </div>
    )
  }

  const accountNumber: string | undefined = client?.account_no || accountNo || undefined
  const cartUnits = cart.reduce((sum, item) => sum + item.qty, 0)
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join('') || 'KB'

  const go = (tab: string) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0 })
  }

  const NAV: Array<{ id: string; label: string; icon: typeof LayoutDashboard; badge?: number } | { section: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { section: 'Purchasing' },
    { id: 'shop', label: 'Shop catalog', icon: BookOpen },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: favorites.size },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartUnits },
    { section: 'Account' },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'account', label: 'Account settings', icon: User },
  ]
  const MOBILE_NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'shop', label: 'Shop', icon: BookOpen },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'account', label: 'Account', icon: User },
  ]
  const tabLabel =
    (NAV.find((n) => 'id' in n && n.id === activeTab) as { label: string } | undefined)?.label ?? 'Overview'

  const orderTotal = (order: any) =>
    Number(order.total_amount) ||
    (order.items ?? []).reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0)
  const orderUnits = (order: any) => (order.items ?? []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)

  const ORDER_FILTERS = ['All', 'Paid', 'Pending', 'Failed']
  const orderCount = (f: string) =>
    f === 'All' ? orders.length : orders.filter((o: any) => (o.payment_status || 'Pending') === f).length
  const q = orderSearch.trim().toLowerCase()
  const visibleOrders = orders.filter(
    (o: any) =>
      (orderFilter === 'All' || (o.payment_status || 'Pending') === orderFilter) &&
      (!q ||
        String(o.order_number).toLowerCase().includes(q) ||
        (o.items ?? []).some(
          (i: any) => String(i.sku ?? '').toLowerCase().includes(q) || String(i.products?.title ?? '').toLowerCase().includes(q),
        )),
  )

  const DOC_TYPES: Array<[string, string]> = [
    ['All', 'All'],
    ['Invoice', 'Invoices'],
    ['Statement', 'Statements'],
    ['CreditNote', 'Credit notes'],
    ['Receipt', 'Receipts'],
    ['Certificate', 'Certificates'],
  ]
  const docTypeLabel = (t?: string) => (t === 'CreditNote' ? 'Credit note' : t || 'Document')
  const docCount = (t: string) => (t === 'All' ? documents.length : documents.filter((d: any) => d.document_type === t).length)
  const visibleDocs = documents.filter((d: any) => docFilter === 'All' || d.document_type === docFilter)
  const docUrl = (d: any) => (typeof d.storage_path === 'string' && d.storage_path.startsWith('http') ? d.storage_path : null)

  const frequent = Object.values(
    orders.reduce((acc: Record<string, { sku: string; title: string; units: number; price: number }>, o: any) => {
      for (const item of o.items ?? []) {
        if (!item.sku) continue
        const row = acc[item.sku] ?? { sku: item.sku, title: item.products?.title || item.sku, units: 0, price: Number(item.price) }
        row.units += Number(item.quantity || 0)
        acc[item.sku] = row
      }
      return acc
    }, {}),
  )
    .sort((a: any, b: any) => b.units - a.units)
    .slice(0, 4) as Array<{ sku: string; title: string; units: number; price: number }>

  const wishlistProducts = products.filter((p: any) => favorites.has(p.sku))
  const inCart = (id: number) => cart.some((item) => item.id === id)

  const setCartQty = (id: number, qty: number) =>
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const max = item.inventory_quantity ?? Infinity
        return { ...item, qty: Math.max(1, Math.min(qty, max)) }
      }),
    )

  const addProduct = (product: any) =>
    addToCart({
      id: product.id,
      sku: product.sku,
      name: product.title,
      price: Number(product.price),
      inventory_quantity: product.inventory_quantity,
    })

  const heartButton = (product: any, className = '') => {
    const saved = favorites.has(product.sku)
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(product.sku)}
        aria-pressed={saved}
        aria-label={`${saved ? 'Remove from' : 'Add to'} wishlist: ${product.title}`}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E3E6EC] bg-white transition hover:bg-[#F4F5F7] ${className}`}
      >
        <Heart className={`h-4 w-4 ${saved ? 'fill-[#C8102E] text-[#C8102E]' : 'text-[#121826]'}`} />
      </button>
    )
  }

  const segmented = (items: Array<[string, string, number]>, value: string, onChange: (v: string) => void, label: string) => (
    <div role="group" aria-label={label} className="flex max-w-full gap-0.5 overflow-x-auto rounded-[7px] bg-[#EEF0F3] p-[3px]">
      {items.map(([id, text, count]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[5px] px-3 text-sm font-medium transition ${
            value === id ? 'bg-white text-[#121826] shadow-[0_1px_2px_rgba(16,24,40,0.12)]' : 'text-[#5A6272] hover:text-[#121826]'
          }`}
        >
          {text}
          <span className="kbc-mono text-xs text-[#5A6272]">{count}</span>
        </button>
      ))}
    </div>
  )

  const creditCard = (
    <section className={`${card} flex flex-col gap-3.5 p-5`}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EEF1F6] text-[#0F1B3D]">
          <ShieldCheck className="h-[18px] w-[18px]" />
        </span>
        <h2 className="kbc-display text-[17px] font-semibold">Trade credit account</h2>
      </div>
      <p className="text-sm leading-[21px] text-[#5A6272]">
        Buy on 30-day terms. Apply online in about 10 minutes and sign on screen.
      </p>
      <ul className="flex flex-col gap-2 text-[13px] text-[#5A6272]">
        {['CIPC registration documents', 'VAT certificate and bank letter', 'ID copies of all directors'].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0B6B41]" />
            {t}
          </li>
        ))}
      </ul>
      <Link href="/credit-application" className={btn.navy}>
        Apply for credit
      </Link>
    </section>
  )

  return (
    <div className={`kbc-portal ${portalFontVars} min-h-screen bg-[#F4F5F7] text-[#121826]`}>
      <Suspense fallback={null}>
        <DashboardTabSync setActiveTab={setActiveTab} />
      </Suspense>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-[#0F1B3D] px-3.5 py-5 text-[#C9D1E4] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-[#24345F] px-1.5 pb-5">
          <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
          <div className="flex flex-col gap-0.5">
            <span className="kbc-display whitespace-nowrap text-[14px] font-bold text-white">KBC Brake &amp; Clutch</span>
            <span className="text-xs text-[#9AA5C1]">Trade client portal</span>
          </div>
        </div>
        <nav aria-label="Portal" className="mt-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) =>
            'section' in item ? (
              <div key={item.section} className="px-3 pb-1.5 pt-[18px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8C98B7]">
                {item.section}
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
                className={`relative flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                  activeTab === item.id ? 'bg-[#1E2C57] text-white' : 'text-[#C9D1E4] hover:bg-[#17244A] hover:text-white'
                }`}
              >
                {activeTab === item.id && <span className="absolute left-0 h-[18px] w-[3px] rounded-r bg-[#C8102E]" />}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
                {!!item.badge && (
                  <span className="kbc-mono ml-auto flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#26365F] px-1.5 text-[11px] text-[#E6EAF4]">
                    {item.badge}
                  </span>
                )}
              </button>
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-lg border border-[#24345F] p-3.5">
            <span className="text-xs font-semibold text-white">Sales desk</span>
            <a href="tel:+27114931336" className="flex items-center gap-2 text-[13px] text-[#C9D1E4] hover:text-white">
              <Phone className="h-3.5 w-3.5" />
              <span className="kbc-mono">011 493 1336</span>
            </a>
            <a href="mailto:kbc1@telkomsa.net" className="flex items-center gap-2 text-[13px] text-[#C9D1E4] hover:text-white">
              <Mail className="h-3.5 w-3.5" />
              kbc1@telkomsa.net
            </a>
            <span className="text-xs text-[#9AA5C1]">Mon–Fri 08:00–17:00 · Sat 08:00–13:00</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-[#C9D1E4] transition hover:bg-[#17244A] hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2.5 bg-[#0F1B3D] pl-4 pr-2 lg:hidden">
          <img src="/images/kbc-logo.png" alt="KBC" className="h-8 w-12 object-contain" />
          <span className="kbc-display text-[15px] font-bold text-white">Client portal</span>
          <button
            type="button"
            onClick={() => go('cart')}
            aria-label={`Cart, ${cartUnits} items`}
            className="relative ml-auto flex h-11 w-11 items-center justify-center text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartUnits > 0 && (
              <span className="kbc-mono absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C8102E] px-1 text-[10px]">
                {cartUnits}
              </span>
            )}
          </button>
          <button type="button" onClick={handleLogout} aria-label="Sign out" className="flex h-11 w-11 items-center justify-center text-white">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-20 hidden h-16 items-center gap-6 border-b border-[#E3E6EC] bg-white px-8 lg:flex">
          <span className="text-[13px] text-[#5A6272]">
            Portal <span className="text-[#A0A7B4]">/</span> <span className="font-medium text-[#121826]">{tabLabel}</span>
          </span>
          <form
            role="search"
            className="ml-auto flex h-10 w-[380px] items-center gap-2.5 rounded-md border border-[#D5DAE2] bg-white px-3 text-[#5A6272] focus-within:border-[#0F1B3D]"
            onSubmit={(e) => {
              e.preventDefault()
              setSearchTerm(topSearch)
              go('shop')
            }}
          >
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="search"
              aria-label="Search parts"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search parts by name or SKU"
              className="h-full flex-1 border-0 bg-transparent text-sm text-[#121826] outline-none placeholder:text-[#8A919E]"
            />
          </form>
          <button
            type="button"
            onClick={() => go('cart')}
            aria-label={`Cart, ${cartUnits} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[#E3E6EC] bg-white hover:bg-[#F4F5F7]"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartUnits > 0 && (
              <span className="kbc-mono absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C8102E] px-1 text-[11px] text-white">
                {cartUnits}
              </span>
            )}
          </button>
          <div className="h-8 w-px bg-[#E3E6EC]" />
          <button type="button" onClick={() => go('account')} className="flex items-center gap-3 text-left">
            <span className="kbc-display flex h-9 w-9 items-center justify-center rounded-full bg-[#E6EAF3] text-[13px] font-bold text-[#0F1B3D]">
              {initials}
            </span>
            <span className="flex flex-col gap-px">
              <span className="max-w-[220px] truncate text-sm font-semibold">{displayName}</span>
              {accountNumber && <span className="kbc-mono text-xs text-[#5A6272]">Acc. {accountNumber}</span>}
            </span>
            <ChevronDown className="h-4 w-4 text-[#5A6272]" />
          </button>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
            {/* Overview */}
            {activeTab === 'overview' && (
              <>
                <PageHead
                  title="Overview"
                  sub={
                    <>
                      {displayName}
                      {accountNumber && (
                        <>
                          {' '}· Account <span className="kbc-mono">{accountNumber}</span>
                        </>
                      )}
                    </>
                  }
                  actions={
                    <>
                      <button type="button" className={btn.secondary} onClick={() => go('orders')}>
                        <Package className="h-4 w-4" /> View orders
                      </button>
                      <button type="button" className={btn.primary} onClick={() => go('shop')}>
                        <BookOpen className="h-4 w-4" /> Browse catalog
                      </button>
                    </>
                  }
                />

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                  {[
                    ['Total orders', String(stats.totalOrders ?? orders.length), 'All orders on your account'],
                    ['Total spent', formatRand(stats.totalSpent), 'Across all orders'],
                    ['Documents', String(documents.length), 'Invoices, statements and more'],
                    ['Wishlist items', String(favorites.size), 'Parts you have saved'],
                  ].map(([label, value, foot]) => (
                    <div key={label} className={`${card} flex flex-col gap-2.5 p-4 sm:p-5`}>
                      <span className="text-[13px] font-medium text-[#5A6272]">{label}</span>
                      <span className="kbc-mono break-words text-xl font-medium tracking-tight sm:text-[26px] sm:leading-8">{value}</span>
                      <span className="hidden text-xs text-[#5A6272] sm:block">{foot}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="flex min-w-0 flex-col gap-6">
                    <section className={`${card} overflow-hidden`}>
                      <SectionHead
                        title="Recent orders"
                        action={
                          <button type="button" onClick={() => go('orders')} className="inline-flex items-center gap-1 text-sm font-medium text-[#1D3A8A] hover:text-[#132A6B]">
                            All orders <ChevronRight className="h-4 w-4" />
                          </button>
                        }
                      />
                      {orders.length === 0 ? (
                        <EmptyState
                          icon={<Package className="h-5 w-5" />}
                          title="No orders yet"
                          text="Orders you place in the catalog appear here with their payment status."
                          action={
                            <button type="button" className={btn.primary} onClick={() => go('shop')}>
                              Browse catalog
                            </button>
                          }
                        />
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className={th}>Order</th>
                                <th className={`${th} hidden sm:table-cell`}>Date</th>
                                <th className={`${th} hidden md:table-cell`}>Items</th>
                                <th className={th}>Payment</th>
                                <th className={`${th} text-right`}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.slice(0, 5).map((order: any) => (
                                <tr key={order.order_number}>
                                  <td className={td}>
                                    <button
                                      type="button"
                                      className="kbc-mono font-medium text-[#1D3A8A] hover:underline"
                                      onClick={() => {
                                        setExpandedOrders(new Set([order.order_number]))
                                        go('orders')
                                      }}
                                    >
                                      {order.order_number}
                                    </button>
                                    <span className="block text-xs text-[#5A6272] sm:hidden">{formatDate(order.order_date)}</span>
                                  </td>
                                  <td className={`${td} hidden text-[#5A6272] sm:table-cell`}>{formatDate(order.order_date)}</td>
                                  <td className={`${td} hidden text-[#5A6272] md:table-cell`}>{orderUnits(order)} items</td>
                                  <td className={td}>
                                    <StatusPill status={order.payment_status} />
                                  </td>
                                  <td className={`${td} kbc-mono text-right font-medium`}>{formatRand(orderTotal(order))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    {frequent.length > 0 && (
                      <section className={`${card} overflow-hidden`}>
                        <SectionHead title="Frequently ordered" />
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className={th}>Part</th>
                                <th className={`${th} hidden sm:table-cell`}>SKU</th>
                                <th className={`${th} text-right`}>Units</th>
                                <th className={th} />
                              </tr>
                            </thead>
                            <tbody>
                              {frequent.map((row) => (
                                <tr key={row.sku}>
                                  <td className={`${td} whitespace-normal font-medium`}>
                                    {row.title}
                                    <span className="kbc-mono block text-xs font-normal text-[#5A6272] sm:hidden">{row.sku}</span>
                                  </td>
                                  <td className={`${td} kbc-mono hidden text-[13px] text-[#5A6272] sm:table-cell`}>{row.sku}</td>
                                  <td className={`${td} kbc-mono text-right`}>{row.units}</td>
                                  <td className={`${td} text-right`}>
                                    <button
                                      type="button"
                                      className={`${btn.secondary} ${btn.small}`}
                                      onClick={() => {
                                        setSearchTerm(row.sku)
                                        go('shop')
                                      }}
                                    >
                                      <Search className="h-4 w-4" /> Find in catalog
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="flex flex-col gap-6">
                    {creditCard}
                    <section className={`${card} overflow-hidden`}>
                      <SectionHead
                        title="Latest documents"
                        action={
                          <button type="button" onClick={() => go('documents')} className="inline-flex items-center gap-1 text-sm font-medium text-[#1D3A8A] hover:text-[#132A6B]">
                            All <ChevronRight className="h-4 w-4" />
                          </button>
                        }
                      />
                      {documents.length === 0 ? (
                        <p className="border-t border-[#EEF0F3] px-5 py-6 text-sm text-[#5A6272]">No documents yet.</p>
                      ) : (
                        documents.slice(0, 4).map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-3 border-t border-[#EEF0F3] px-5 py-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EEF1F6] text-[#0F1B3D]">
                              <FileText className="h-[18px] w-[18px]" />
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate text-sm font-medium">{doc.file_name}</span>
                              <span className="text-xs text-[#5A6272]">
                                {docTypeLabel(doc.document_type)} · {formatDate(doc.created_at)}
                              </span>
                            </div>
                            {docUrl(doc) && (
                              <a href={docUrl(doc)!} target="_blank" rel="noopener noreferrer" aria-label={`Download ${doc.file_name}`} className={iconBtn}>
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}

            {/* Shop catalog */}
            {activeTab === 'shop' && (
              <>
                <PageHead
                  title="Shop catalog"
                  sub="Brake and clutch components. Stock levels are live."
                  actions={
                    <>
                      <button type="button" className={btn.secondary} onClick={() => go('wishlist')}>
                        <Heart className="h-4 w-4" /> Wishlist · {favorites.size}
                      </button>
                      <button type="button" className={btn.primary} onClick={() => go('cart')}>
                        <ShoppingCart className="h-4 w-4" /> Cart · {cartUnits} {cartUnits === 1 ? 'item' : 'items'}
                      </button>
                    </>
                  }
                />
                <div className="flex flex-col gap-2">
                  <label className="flex h-11 items-center gap-2.5 rounded-md border border-[#D5DAE2] bg-white px-3.5 text-[#5A6272] focus-within:border-[#0F1B3D]">
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="sr-only">Search the catalog</span>
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by part name or SKU"
                      className="h-full flex-1 border-0 bg-transparent text-sm text-[#121826] outline-none placeholder:text-[#8A919E]"
                    />
                    {searchTerm && (
                      <button type="button" aria-label="Clear search" onClick={() => setSearchTerm('')} className="text-[#5A6272] hover:text-[#121826]">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                  <p className="text-[13px] text-[#5A6272]">
                    Showing {products.length} of {totalProducts} parts{searchQuery ? ` matching “${searchQuery}”` : ''}
                  </p>
                </div>

                {prodLoading && products.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-[#0F1B3D]" />
                  </div>
                ) : products.length === 0 ? (
                  <section className={card}>
                    <EmptyState icon={<Search className="h-5 w-5" />} title="No parts found" text="Try a different part name or SKU, or clear the search." />
                  </section>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {products.map((product: any) => {
                        const stock = Number(product.inventory_quantity ?? 0)
                        const qty = productQuantities[product.id] || 1
                        return (
                          <article key={product.id} className={`${card} flex flex-col overflow-hidden`}>
                            <div className="relative h-44 bg-[#EEF0F3]">
                              <Link href={`/customer/catalog/${product.id}`} aria-label={`View ${product.title}`} className="block h-full">
                                {product.image_url ? (
                                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full items-center justify-center text-[#A0A7B4]">
                                    <Package className="h-10 w-10" />
                                  </span>
                                )}
                              </Link>
                              {heartButton(product, 'absolute right-2.5 top-2.5')}
                            </div>
                            <div className="flex flex-1 flex-col gap-1.5 p-4">
                              <Link href={`/customer/catalog/${product.id}`} className="text-[15px] font-semibold leading-5 text-[#121826] hover:text-[#1D3A8A]">
                                {product.title}
                              </Link>
                              <span className="kbc-mono text-xs text-[#5A6272]">SKU {product.sku}</span>
                              <StockLabel qty={stock} />
                              {product.description && <p className="line-clamp-2 text-xs leading-[18px] text-[#5A6272]">{product.description}</p>}
                              <div className="mt-auto flex flex-col gap-2.5 pt-3">
                                <span className="kbc-mono text-lg font-medium">{formatRand(product.price)}</span>
                                {stock > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <div role="group" aria-label={`Quantity for ${product.title}`} className="flex h-9 items-center overflow-hidden rounded-md border border-[#D5DAE2]">
                                      <button
                                        type="button"
                                        aria-label="Decrease quantity"
                                        className="flex h-9 w-8 items-center justify-center hover:bg-[#F4F5F7]"
                                        onClick={() => {
                                          setProductQuantities((prev) => ({ ...prev, [product.id]: Math.max(1, (prev[product.id] || 1) - 1) }))
                                          setStockErrors((prev) => {
                                            const n = { ...prev }
                                            delete n[product.id]
                                            return n
                                          })
                                        }}
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="kbc-mono w-8 text-center text-sm">{qty}</span>
                                      <button
                                        type="button"
                                        aria-label="Increase quantity"
                                        className="flex h-9 w-8 items-center justify-center hover:bg-[#F4F5F7]"
                                        onClick={() => {
                                          const next = qty + 1
                                          if (next > stock) {
                                            setStockErrors((prev) => ({ ...prev, [product.id]: `Only ${stock} units available` }))
                                            return
                                          }
                                          setProductQuantities((prev) => ({ ...prev, [product.id]: next }))
                                        }}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    {inCart(product.id) ? (
                                      <button type="button" onClick={() => go('cart')} className={`${btn.secondary} ${btn.small} flex-1`}>
                                        <CheckCircle2 className="h-4 w-4 text-[#0B6B41]" /> In cart
                                      </button>
                                    ) : (
                                      <button type="button" onClick={() => addProduct(product)} className={`${btn.navy} ${btn.small} flex-1`}>
                                        <ShoppingCart className="h-4 w-4" /> Add to cart
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <button type="button" disabled className={`${btn.secondary} ${btn.small}`}>
                                    Out of stock
                                  </button>
                                )}
                                {stockErrors[product.id] && <p className="text-xs font-medium text-[#A4161A]">{stockErrors[product.id]}</p>}
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center">
                        <button type="button" onClick={loadMoreProducts} disabled={prodLoading} className={btn.secondary}>
                          {prodLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {prodLoading ? 'Loading…' : 'Load more parts'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Wishlist */}
            {activeTab === 'wishlist' && (
              <>
                <PageHead
                  title="Wishlist"
                  sub={`${favorites.size} saved ${favorites.size === 1 ? 'part' : 'parts'}`}
                  actions={
                    <button type="button" className={btn.secondary} onClick={() => go('shop')}>
                      <BookOpen className="h-4 w-4" /> Shop catalog
                    </button>
                  }
                />
                <section className={`${card} overflow-hidden`}>
                  {favoritesLoading ? (
                    <div className="flex justify-center py-14">
                      <Loader2 className="h-7 w-7 animate-spin text-[#0F1B3D]" />
                    </div>
                  ) : favorites.size === 0 ? (
                    <EmptyState
                      icon={<Heart className="h-5 w-5" />}
                      title="No saved parts"
                      text="Tap the heart on any part in the catalog to keep it here for quick reordering."
                      action={
                        <button type="button" className={btn.primary} onClick={() => go('shop')}>
                          Browse catalog
                        </button>
                      }
                    />
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={th}>Part</th>
                              <th className={th}>SKU</th>
                              <th className={th}>Availability</th>
                              <th className={`${th} text-right`}>Price</th>
                              <th className={th} />
                            </tr>
                          </thead>
                          <tbody>
                            {wishlistProducts.map((product: any) => {
                              const stock = Number(product.inventory_quantity ?? 0)
                              return (
                                <tr key={product.id}>
                                  <td className={td}>
                                    <div className="flex items-center gap-3.5">
                                      {product.image_url ? (
                                        <img src={product.image_url} alt="" className="h-14 w-14 rounded-md border border-[#E3E6EC] object-cover" />
                                      ) : (
                                        <span className="flex h-14 w-14 items-center justify-center rounded-md bg-[#EEF0F3] text-[#A0A7B4]">
                                          <Package className="h-5 w-5" />
                                        </span>
                                      )}
                                      <span className="whitespace-normal font-semibold">{product.title}</span>
                                    </div>
                                  </td>
                                  <td className={`${td} kbc-mono text-[13px] text-[#5A6272]`}>{product.sku}</td>
                                  <td className={td}>
                                    <StockLabel qty={stock} />
                                  </td>
                                  <td className={`${td} kbc-mono text-right`}>{formatRand(product.price)}</td>
                                  <td className={`${td} text-right`}>
                                    <div className="inline-flex gap-2">
                                      {inCart(product.id) ? (
                                        <button type="button" onClick={() => go('cart')} className={`${btn.secondary} ${btn.small}`}>
                                          In cart
                                        </button>
                                      ) : (
                                        <button type="button" disabled={stock <= 0} onClick={() => addProduct(product)} className={`${btn.navy} ${btn.small}`}>
                                          <ShoppingCart className="h-4 w-4" /> {stock > 0 ? 'Add to cart' : 'Out of stock'}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        aria-label={`Remove ${product.title} from wishlist`}
                                        onClick={() => toggleFavorite(product.sku)}
                                        className={iconBtn}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {wishlistProducts.length < favorites.size && (
                        <p className="border-t border-[#EEF0F3] px-5 py-3.5 text-[13px] text-[#5A6272]">
                          {favorites.size - wishlistProducts.length} saved {favorites.size - wishlistProducts.length === 1 ? 'part is' : 'parts are'} not
                          in the catalog page currently loaded. Search the catalog by name or SKU to see {favorites.size - wishlistProducts.length === 1 ? 'it' : 'them'}.
                        </p>
                      )}
                    </>
                  )}
                </section>
              </>
            )}

            {/* Cart */}
            {activeTab === 'cart' && (
              <>
                <PageHead
                  title="Cart"
                  sub={cart.length ? `${cart.length} ${cart.length === 1 ? 'part' : 'parts'} · ${cartUnits} units` : 'Your cart is empty'}
                  actions={
                    <button type="button" className={btn.secondary} onClick={() => go('shop')}>
                      <BookOpen className="h-4 w-4" /> Continue shopping
                    </button>
                  }
                />
                {cart.length === 0 ? (
                  <section className={card}>
                    <EmptyState
                      icon={<ShoppingCart className="h-5 w-5" />}
                      title="Your cart is empty"
                      text="Add parts from the catalog, then come back here to check out."
                      action={
                        <button type="button" className={btn.primary} onClick={() => go('shop')}>
                          Browse catalog
                        </button>
                      }
                    />
                  </section>
                ) : (
                  <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <section className={`${card} min-w-0 overflow-hidden`}>
                      <div className="hidden grid-cols-[minmax(0,1fr)_120px_132px_120px_40px] gap-4 bg-[#F8F9FB] px-5 py-2.5 text-xs font-semibold text-[#5A6272] md:grid">
                        <span>Part</span>
                        <span className="text-right">Unit price</span>
                        <span className="text-center">Quantity</span>
                        <span className="text-right">Line total</span>
                        <span />
                      </div>
                      {cart.map((item) => {
                        const max = item.inventory_quantity ?? Infinity
                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-t border-[#EEF0F3] px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_132px_120px_40px]"
                          >
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="text-[15px] font-semibold">{item.name}</span>
                              <span className="kbc-mono text-xs text-[#5A6272]">SKU {item.sku}</span>
                              {item.inventory_quantity !== undefined && item.qty >= item.inventory_quantity && (
                                <span className="text-xs font-medium text-[#7A4F00]">Only {item.inventory_quantity} available</span>
                              )}
                            </div>
                            <span className="kbc-mono hidden text-right text-sm md:block">{formatRand(item.price)}</span>
                            <div role="group" aria-label={`Quantity for ${item.name}`} className="flex h-10 items-center justify-self-start overflow-hidden rounded-md border border-[#D5DAE2] md:justify-self-center">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={item.qty <= 1}
                                onClick={() => setCartQty(item.id, item.qty - 1)}
                                className="flex h-10 w-10 items-center justify-center hover:bg-[#F4F5F7] disabled:opacity-40"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="kbc-mono flex h-10 w-11 items-center justify-center border-x border-[#E3E6EC] text-sm">{item.qty}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={item.qty >= max}
                                onClick={() => setCartQty(item.id, item.qty + 1)}
                                className="flex h-10 w-10 items-center justify-center hover:bg-[#F4F5F7] disabled:opacity-40"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="kbc-mono text-right text-[15px] font-medium">{formatRand(item.price * item.qty)}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => setCart((prev) => prev.filter((c) => c.id !== item.id))}
                              className={`${iconBtn} justify-self-end text-[#5A6272]`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      })}
                    </section>

                    <aside className={`${card} flex flex-col gap-[18px] p-5`}>
                      <h2 className="kbc-display text-[17px] font-semibold">Order summary</h2>
                      <div className="flex flex-col gap-2.5 text-sm">
                        <div className="flex justify-between text-[#5A6272]">
                          <span>Parts</span>
                          <span className="kbc-mono">{cart.length}</span>
                        </div>
                        <div className="flex justify-between text-[#5A6272]">
                          <span>Units</span>
                          <span className="kbc-mono">{cartUnits}</span>
                        </div>
                        <div className="flex items-baseline justify-between border-t border-[#E3E6EC] pt-3">
                          <span className="font-semibold">Total</span>
                          <span className="kbc-mono text-[22px] font-medium">{formatRand(cartTotal)}</span>
                        </div>
                      </div>
                      <fieldset className="flex flex-col gap-2.5">
                        <legend className="mb-2.5 text-[13px] font-semibold">Payment method</legend>
                        {(
                          [
                            ['payfast', 'Pay now with PayFast', 'Card or instant EFT. You will be taken to PayFast to pay securely.'],
                            ['credit', 'Order on account', 'For approved credit accounts. The order stays pending until our accounts team confirms it.'],
                          ] as const
                        ).map(([value, title, desc]) => (
                          <label
                            key={value}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg bg-white ${
                              paymentMethod === value ? 'border-2 border-[#0F1B3D] p-[15px]' : 'border border-[#D5DAE2] p-4'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment-method"
                              value={value}
                              checked={paymentMethod === value}
                              onChange={() => setPaymentMethod(value)}
                              className="mt-0.5 h-[18px] w-[18px] accent-[#0F1B3D]"
                            />
                            <span className="flex flex-col gap-1">
                              <span className="text-sm font-semibold">{title}</span>
                              <span className="text-[13px] leading-[19px] text-[#5A6272]">{desc}</span>
                              {value === 'credit' && (
                                <Link href="/credit-application" className="text-[13px] font-medium text-[#1D3A8A] hover:underline">
                                  No credit account? Apply online
                                </Link>
                              )}
                            </span>
                          </label>
                        ))}
                      </fieldset>
                      <button type="button" onClick={() => handlePlaceOrder(paymentMethod)} disabled={submittingOrder} className={`${btn.primary} h-12 text-[15px]`}>
                        {submittingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
                        {submittingOrder
                          ? 'Placing order…'
                          : paymentMethod === 'payfast'
                            ? `Pay ${formatRand(cartTotal)}`
                            : 'Place order on account'}
                      </button>
                      <p className="text-xs leading-[18px] text-[#5A6272]">
                        By placing this order you accept our{' '}
                        <Link href="/terms-and-conditions" className="text-[#1D3A8A] underline">
                          terms and conditions
                        </Link>
                        .
                      </p>
                    </aside>
                  </div>
                )}
              </>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <>
                <PageHead
                  title="Orders"
                  sub={accountNumber ? <>Every order placed on account <span className="kbc-mono">{accountNumber}</span></> : 'Every order placed on your account'}
                  actions={
                    <button type="button" className={btn.primary} onClick={() => go('shop')}>
                      <Plus className="h-4 w-4" /> New order
                    </button>
                  }
                />
                {orderSubmitted && (
                  <div role="status" className="flex items-center gap-2.5 rounded-lg border border-[#B7DEC9] bg-[#E7F4EE] px-4 py-3 text-sm font-medium text-[#0B6B41]">
                    <CheckCircle2 className="h-4 w-4" /> Order placed. It stays pending until our accounts team confirms it.
                  </div>
                )}
                <section className={`${card} overflow-hidden`}>
                  <div className="flex flex-col gap-3 border-b border-[#E3E6EC] px-5 py-4 md:flex-row md:items-center">
                    {segmented(
                      ORDER_FILTERS.map((f) => [f, f, orderCount(f)]),
                      orderFilter,
                      setOrderFilter,
                      'Filter by payment status',
                    )}
                    <label className="flex h-[38px] items-center gap-2.5 rounded-md border border-[#D5DAE2] px-3 text-[#5A6272] focus-within:border-[#0F1B3D] md:ml-auto md:w-[300px]">
                      <Search className="h-4 w-4 shrink-0" />
                      <span className="sr-only">Search orders</span>
                      <input
                        type="search"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Order number, part or SKU"
                        className="h-full flex-1 border-0 bg-transparent text-sm text-[#121826] outline-none placeholder:text-[#8A919E]"
                      />
                    </label>
                  </div>
                  {visibleOrders.length === 0 ? (
                    <EmptyState
                      icon={<Package className="h-5 w-5" />}
                      title={orders.length ? 'No matching orders' : 'No orders yet'}
                      text={orders.length ? 'Try a different status or search.' : 'Orders you place in the catalog appear here.'}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={th}>Order</th>
                            <th className={`${th} hidden sm:table-cell`}>Date</th>
                            <th className={`${th} hidden md:table-cell`}>Items</th>
                            <th className={th}>Payment</th>
                            <th className={`${th} text-right`}>Total</th>
                            <th className={`${th} w-16`} />
                          </tr>
                        </thead>
                        <tbody>
                          {visibleOrders.map((order: any) => {
                            const open = expandedOrders.has(order.order_number)
                            const toggle = () => {
                              const next = new Set(expandedOrders)
                              if (open) next.delete(order.order_number)
                              else next.add(order.order_number)
                              setExpandedOrders(next)
                            }
                            return (
                              <React.Fragment key={order.order_number}>
                                <tr className={open ? 'bg-[#F8F9FB]' : ''}>
                                  <td className={`${td} ${open ? 'border-b-0' : ''}`}>
                                    <span className="kbc-mono font-semibold">{order.order_number}</span>
                                    <span className="block text-xs text-[#5A6272] sm:hidden">{formatDate(order.order_date)}</span>
                                  </td>
                                  <td className={`${td} ${open ? 'border-b-0' : ''} hidden text-[#5A6272] sm:table-cell`}>{formatDate(order.order_date)}</td>
                                  <td className={`${td} ${open ? 'border-b-0' : ''} hidden text-[#5A6272] md:table-cell`}>{orderUnits(order)} items</td>
                                  <td className={`${td} ${open ? 'border-b-0' : ''}`}>
                                    <StatusPill status={order.payment_status} />
                                  </td>
                                  <td className={`${td} ${open ? 'border-b-0' : ''} kbc-mono text-right font-medium`}>{formatRand(orderTotal(order))}</td>
                                  <td className={`${td} ${open ? 'border-b-0' : ''} text-right`}>
                                    <button
                                      type="button"
                                      onClick={toggle}
                                      aria-expanded={open}
                                      aria-label={`${open ? 'Hide' : 'Show'} items in order ${order.order_number}`}
                                      className={iconBtn}
                                    >
                                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                    </button>
                                  </td>
                                </tr>
                                {open && (
                                  <tr>
                                    <td colSpan={6} className="border-b border-[#EEF0F3] bg-[#F8F9FB] p-0">
                                      <div className="px-4 pb-5 pt-1 sm:px-6">
                                        {order.items?.length ? (
                                          <div className={`${card} overflow-x-auto`}>
                                            <table className="w-full border-collapse">
                                              <thead>
                                                <tr className="text-xs font-semibold text-[#5A6272]">
                                                  <th className="border-b border-[#DDE1E8] px-4 py-2 text-left">Product</th>
                                                  <th className="border-b border-[#DDE1E8] px-4 py-2 text-left">SKU</th>
                                                  <th className="border-b border-[#DDE1E8] px-4 py-2 text-right">Qty</th>
                                                  <th className="border-b border-[#DDE1E8] px-4 py-2 text-right">Unit price</th>
                                                  <th className="border-b border-[#DDE1E8] px-4 py-2 text-right">Tax</th>
                                                  <th className="border-b border-[#DDE1E8] px-4 py-2 text-right">Line total</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {order.items.map((item: any, idx: number) => (
                                                  <tr key={idx} className="text-sm">
                                                    <td className="border-b border-[#EEF0F3] px-4 py-2.5">{item.products?.title || '—'}</td>
                                                    <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-2.5 text-[13px] text-[#5A6272]">{item.sku}</td>
                                                    <td className="kbc-mono border-b border-[#EEF0F3] px-4 py-2.5 text-right">{item.quantity}</td>
                                                    <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-2.5 text-right">{formatRand(item.price)}</td>
                                                    <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-2.5 text-right">{formatRand(item.tax)}</td>
                                                    <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-2.5 text-right font-medium">
                                                      {formatRand(Number(item.price) * Number(item.quantity))}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <p className="py-3 text-sm text-[#5A6272]">No line items recorded for this order.</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {orders.length > 0 && (
                    <p className="px-5 py-3.5 text-[13px] text-[#5A6272]">
                      Showing {visibleOrders.length} of {orders.length} orders
                    </p>
                  )}
                </section>
              </>
            )}

            {/* Documents */}
            {activeTab === 'documents' && (
              <>
                <PageHead
                  title="Documents"
                  sub={accountNumber ? <>Invoices, statements and certificates for account <span className="kbc-mono">{accountNumber}</span></> : 'Invoices, statements and certificates for your account'}
                />
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <section className={`${card} min-w-0 overflow-hidden`}>
                    <div className="border-b border-[#E3E6EC] px-5 py-4">
                      {segmented(DOC_TYPES.map(([id, label]) => [id, label, docCount(id)]), docFilter, setDocFilter, 'Filter by document type')}
                    </div>
                    {visibleDocs.length === 0 ? (
                      <EmptyState
                        icon={<FileText className="h-5 w-5" />}
                        title={documents.length ? 'No documents of this type' : 'No documents yet'}
                        text="Invoices, statements and certificates for your account appear here."
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={th}>Document</th>
                              <th className={th}>Type</th>
                              <th className={th}>Date</th>
                              <th className={`${th} text-right`}>Size</th>
                              <th className={`${th} w-14`} />
                            </tr>
                          </thead>
                          <tbody>
                            {visibleDocs.map((doc: any) => (
                              <tr key={doc.id}>
                                <td className={td}>
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md bg-[#EEF1F6] text-[#0F1B3D]">
                                      <FileText className="h-4 w-4" />
                                    </span>
                                    <span className="font-medium">{doc.file_name}</span>
                                  </div>
                                </td>
                                <td className={`${td} text-[#5A6272]`}>{docTypeLabel(doc.document_type)}</td>
                                <td className={`${td} text-[#5A6272]`}>{formatDate(doc.created_at)}</td>
                                <td className={`${td} kbc-mono text-right text-[13px] text-[#5A6272]`}>{formatBytes(doc.file_size)}</td>
                                <td className={`${td} text-right`}>
                                  {docUrl(doc) ? (
                                    <a href={docUrl(doc)!} target="_blank" rel="noopener noreferrer" aria-label={`Download ${doc.file_name}`} className={iconBtn}>
                                      <Download className="h-4 w-4" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-[#8A919E]">Unavailable</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className={`${card} flex flex-col gap-4 p-5`}>
                    <div className="flex flex-col gap-1">
                      <h2 className="kbc-display text-[17px] font-semibold">Upload a document</h2>
                      <p className="text-[13px] leading-[19px] text-[#5A6272]">Send us proof of payment, certificates or signed documents.</p>
                    </div>
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                      Document type
                      <select
                        value={selectedDocumentType}
                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                        disabled={uploadingDocument}
                        className={input}
                      >
                        <option value="Receipt">Receipt / proof of payment</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Invoice">Invoice</option>
                        <option value="Statement">Statement</option>
                        <option value="CreditNote">Credit note</option>
                      </select>
                    </label>
                    <label
                      className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-[#B9C1CE] bg-[#FAFBFC] px-4 py-6 text-center transition hover:border-[#0F1B3D] ${
                        uploadingDocument ? 'pointer-events-none opacity-70' : ''
                      }`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF1F6] text-[#0F1B3D]">
                        {uploadingDocument ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Upload className="h-[18px] w-[18px]" />}
                      </span>
                      <span className="text-sm font-medium">
                        {uploadingDocument ? (
                          'Uploading…'
                        ) : (
                          <>
                            Choose a file to <span className="text-[#1D3A8A] underline">upload</span>
                          </>
                        )}
                      </span>
                      <span className="text-xs text-[#5A6272]">PDF or image</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        disabled={uploadingDocument}
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadDocument(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {uploadDocumentError && (
                      <p role="alert" className="flex items-center gap-2 text-sm text-[#A4161A]">
                        <AlertCircle className="h-4 w-4" /> {uploadDocumentError}
                      </p>
                    )}
                  </section>
                </div>
              </>
            )}

            {/* Account settings */}
            {activeTab === 'account' && (
              <>
                <PageHead title="Account settings" sub="Company details, your contact information and sign-in security" />
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="flex min-w-0 flex-col gap-6">
                    <section className={`${card} px-6 py-5`}>
                      <div className="flex flex-col gap-1 pb-3">
                        <h2 className="kbc-display text-[17px] font-semibold">{displayName}</h2>
                        <p className="text-[13px] text-[#5A6272]">Company details are maintained by KBC. Contact the sales desk to change them.</p>
                      </div>
                      <dl>
                        {(
                          [
                            ['Account number', accountNumber ? <span className="kbc-mono">{accountNumber}</span> : null],
                            ['Account status', <StatusPill key="s" status="Active" />],
                            ['Business type', client?.business_type],
                            ['Member since', client?.created_at ? formatDate(client.created_at) : null],
                            ['Address', client?.address],
                            ['Salesperson', client?.salesperson_name],
                            ['Sales code', client?.sales_code ? <span className="kbc-mono">{client.sales_code}</span> : null],
                          ] as Array<[string, React.ReactNode]>
                        ).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-1 gap-1 border-t border-[#EEF0F3] py-3 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                            <dt className="text-[#5A6272]">{k}</dt>
                            <dd className="font-medium">{v || <span className="text-[#8A919E]">—</span>}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>

                    <section className={`${card} flex flex-col gap-[18px] px-6 py-5`}>
                      <h2 className="kbc-display text-[17px] font-semibold">Contact person</h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          Full name
                          <input className={input} value={editFormData.full_name} onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })} autoComplete="name" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          Email address
                          <input type="email" className={input} value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} autoComplete="email" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          Phone number
                          <input type="tel" className={`${input} kbc-mono`} value={editFormData.phone_number} onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })} autoComplete="tel" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          Business type
                          <select className={input} value={editFormData.business_type} onChange={(e) => setEditFormData({ ...editFormData, business_type: e.target.value })}>
                            <option value="">Select business type</option>
                            <option value="Distributor">Distributor</option>
                            <option value="Retailer">Retailer</option>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Reseller">Reseller</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {profileSaved && (
                          <span role="status" className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#0B6B41]">
                            <CheckCircle2 className="h-4 w-4" /> Changes saved
                          </span>
                        )}
                        <button
                          type="button"
                          className={btn.secondary}
                          onClick={() =>
                            setEditFormData({
                              email: client?.email || '',
                              full_name: client?.full_name || '',
                              phone_number: client?.phone_number || '',
                              business_type: client?.business_type || '',
                              address: client?.address || '',
                            })
                          }
                        >
                          Reset
                        </button>
                        <button type="button" className={btn.primary} disabled={savingProfile} onClick={handleSaveProfile}>
                          {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                          {savingProfile ? 'Saving…' : 'Save changes'}
                        </button>
                      </div>
                    </section>

                    <section className={`${card} flex flex-col gap-[18px] px-6 py-5`}>
                      <h2 className="kbc-display text-[17px] font-semibold">Password</h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          Current password
                          <input type="password" className={input} value={passwordFormData.currentPassword} onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })} autoComplete="current-password" />
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          New password
                          <input type="password" className={input} value={passwordFormData.newPassword} onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })} autoComplete="new-password" />
                          <span className="text-xs font-normal text-[#5A6272]">At least 6 characters</span>
                        </label>
                        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                          Confirm new password
                          <input type="password" className={input} value={passwordFormData.confirmPassword} onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })} autoComplete="new-password" />
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {passwordError && (
                          <span role="alert" className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#A4161A]">
                            <AlertCircle className="h-4 w-4" /> {passwordError}
                          </span>
                        )}
                        {passwordSuccess && (
                          <span role="status" className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#0B6B41]">
                            <CheckCircle2 className="h-4 w-4" /> {passwordSuccess}
                          </span>
                        )}
                        <button type="button" className={btn.navy} disabled={updatingPassword} onClick={handleChangePassword}>
                          {updatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                          {updatingPassword ? 'Updating…' : 'Update password'}
                        </button>
                      </div>
                    </section>
                  </div>

                  <div className="flex flex-col gap-6">
                    {creditCard}
                    <section className={`${card} flex flex-col gap-3 p-5`}>
                      <h2 className="kbc-display text-[17px] font-semibold">
                        {client?.salesperson_name ? 'Your sales representative' : 'Sales desk'}
                      </h2>
                      {client?.salesperson_name && (
                        <div className="flex items-center gap-3">
                          <span className="kbc-display flex h-10 w-10 items-center justify-center rounded-full bg-[#E6EAF3] text-sm font-bold text-[#0F1B3D]">
                            {String(client.salesperson_name)
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((w: string) => w[0]?.toUpperCase())
                              .join('')}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold">{client.salesperson_name}</span>
                            {client?.sales_code && <span className="kbc-mono text-xs text-[#5A6272]">Sales code {client.sales_code}</span>}
                          </div>
                        </div>
                      )}
                      <a href="tel:+27114931336" className="flex items-center gap-2 text-sm text-[#1D3A8A] hover:underline">
                        <Phone className="h-4 w-4" />
                        <span className="kbc-mono">011 493 1336</span>
                      </a>
                      <a href="mailto:kbc1@telkomsa.net" className="flex items-center gap-2 text-sm text-[#1D3A8A] hover:underline">
                        <Mail className="h-4 w-4" />
                        kbc1@telkomsa.net
                      </a>
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Mobile tab bar */}
        <nav aria-label="Portal" className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-[#E3E6EC] bg-white lg:hidden">
          {MOBILE_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
                activeTab === item.id ? 'font-semibold text-[#0F1B3D]' : 'font-medium text-[#5A6272]'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
