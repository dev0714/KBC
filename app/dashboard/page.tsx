'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navigation/navbar'
//import { Footer } from '@/components/navigation/footer' commented out to remove the Footer from the CRM 
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogOut, ShoppingCart, FileText, User, Settings, Download, Clock, CheckCircle2, AlertCircle, TrendingUp, Phone, Mail, Loader2, Heart, X, ChevronDown } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Paid':
      return 'bg-gradient-to-r from-green-500/20 to-green-400/20 border-green-500/50 text-green-300'
    case 'Pending':
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border-yellow-500/50 text-yellow-300'
    case 'Shipped':
      return 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 border-blue-500/50 text-blue-300'
    case 'Active':
      return 'bg-gradient-to-r from-green-500/20 to-green-400/20 border-green-500/50 text-green-300'
    case 'Expired':
    case 'Cancelled':
      return 'bg-gradient-to-r from-gray-500/20 to-gray-400/20 border-gray-500/50 text-gray-300'
    default:
      return 'bg-gradient-to-r from-slate-500/20 to-slate-400/20 border-slate-500/50 text-slate-300'
  }
}

function getDaysLeft(expiryDate: string) {
  const diff = new Date(expiryDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
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
  const [pendingOrder, setPendingOrder] = useState<{items: Array<{id: number; sku: string; name: string; price: number; qty: number}>; total: number} | null>(null)
  
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
  const [editMode, setEditMode] = useState(false)
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
  const client = dashData?.client
  const displayName = client?.business_name || client?.client_name || client?.full_name || 'Customer'
  const orders = dashData?.orders || []
  const quotes = dashData?.quotes || []
  const documents = dashData?.documents || []
  const stats = dashData?.stats || { totalOrders: 0, activeQuotes: 0, totalSpent: 0 }

  const statsCards = [
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Spent', value: `R${Number(stats.totalSpent).toLocaleString()}`, icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: 'Wishlist Items', value: String(favorites.size), icon: Heart, color: 'from-pink-500 to-pink-600' },
  ]

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
      if (editMode && client) {
        setEditFormData({
          email: client.email || '',
          full_name: client.full_name || '',
          phone_number: client.phone_number || '',
          business_type: client.business_type || '',
          address: client.address || ''
      })
    }
  }, [editMode, client])

  // Manage body overflow when modal is open
  useEffect(() => {
    if (editMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [editMode])

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

      // Insert into documents table
      const { error: insertError } = await supabase
        .from('documents')
        .insert([{
          client_account_no: accountNo,
          file_name: file.name,
          storage_path: data.publicUrl,
          document_type: selectedDocumentType,
          file_size: file.size,
        }])

      if (insertError) {
        console.error('[v0] Document insert error:', insertError)
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
        const supabase = createClient()
        const { data, error } = await supabase
          .from('wishlists')
          .select('sku')
          .eq('account_no', accountNo)
        
        if (error) {
          console.error('[v0] Error fetching wishlists:', error)
          setFavoritesLoading(false)
          return
        }
        
        const skus = new Set(data?.map(row => row.sku) || [])
        setFavorites(skus)
      } catch (error) {
        console.error('[v0] Error in fetchWishlists:', error)
      } finally {
        setFavoritesLoading(false)
      }
    }
    
    fetchWishlists()
  }, [accountNo])

  const toggleFavorite = async (sku: string) => {
    const supabase = createClient()
    const newFavorites = new Set(favorites)
    
    try {
      if (newFavorites.has(sku)) {
        // Remove from wishlist
        newFavorites.delete(sku)
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('account_no', accountNo)
          .eq('sku', sku)
        
        if (error) {
          console.error('[v0] Error removing from wishlist:', error)
          return
        }
      } else {
        // Add to wishlist
        newFavorites.add(sku)
        const { error } = await supabase
          .from('wishlists')
          .insert({
            account_no: accountNo,
            sku: sku
          })
        
        if (error) {
          console.error('[v0] Error adding to wishlist:', error)
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
        const supabase = createClient()
        const { error } = await supabase
          .from('users')
          .update({
            email: editFormData.email,
            full_name: editFormData.full_name,
            phone_number: editFormData.phone_number,
            business_type: editFormData.business_type
          })
        .eq('id', userId)

      if (error) {
        console.error('[v0] Error updating profile:', error)
        alert('Error updating profile. Please try again.')
      } else {
        setEditMode(false)
        // Refresh the dashboard data
        window.location.reload()
      }
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
    if (!pendingOrder || cart.length === 0) return
    
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
          const response = await fetch('/api/payfast/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 1,
              amount: pendingOrder.total.toString(),
              item_name: `Order ${orderNumber}`,
              item_description: `KBC Order - ${pendingOrder.items.length} items`,
              custom_str1: String(createdOrderId),
              custom_int1: '1',
              name_first: client?.full_name?.split(' ')[0] || 'Customer',
              name_last: client?.full_name?.split(' ')[1] || '',
              email_address: client?.email || '',
              cell_number: client?.phone_number || ''
            })
          })
          
          const paymentData = await response.json()
          console.log('[v0] Payment API response:', { status: response.status, hasUrl: !!paymentData.url, error: paymentData.error })
          
          if (!response.ok) {
            throw new Error(paymentData.error || paymentData.details || `HTTP ${response.status}`)
          }
          
            if (paymentData.url) {
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
        setPendingOrder(null)
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
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
        <p className="mt-4 text-slate-400 font-bold">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1]">
      <Navbar />

      <main className="flex-1">
        {/* Header Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-[#0056a1]/40 via-[#002463]/30 to-transparent border-b border-red-500/20 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-slate-400/5 rounded-full blur-3xl -z-10"></div>
          <div className="relative container mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="animate-fade-in-down">
                <img src="/kbc-logo.png" alt="KBC" className="h-12 w-auto mb-2" />
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
              </div>
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all duration-300 gap-2 animate-fade-in-up"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Tabs */}
          <div className="mb-8 border-b border-slate-400/30">
            <div className="flex flex-wrap gap-2 pb-2">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'shop', label: 'Shop Catalog', icon: '🛍️' },
                { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
                { id: 'cart', label: 'Shopping Cart', icon: '🛒' },
                { id: 'orders', label: 'Orders', icon: '📦' },
                { id: 'documents', label: 'Documents', icon: '📑' },
                { id: 'account', label: 'Account', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-bold whitespace-nowrap transition-all duration-300 border-b-2 text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-400 bg-gradient-to-b from-red-500/10 to-transparent'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400/30'
                  }`}
                >
                  <span className="inline-block mr-2"></span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* Shopping Cart Tab */}
            {activeTab === 'cart' && (
              <div className="animate-fade-in-up">
                <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-8 shadow-xl shadow-red-500/10 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold mb-6 text-white">Shopping Cart</h2>
                  
                  {cart.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg font-bold">Your cart is empty</p>
                      <p className="text-slate-500 mb-6">Browse the Shop Catalog to add products</p>
                      <Button 
                        onClick={() => setActiveTab('shop')}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold"
                      >
                        Go to Shop
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-slate-400/30">
                              <th className="text-left py-4 font-bold text-slate-200">Product Name</th>
                              <th className="text-left py-4 font-bold text-slate-200">Price</th>
                              <th className="text-left py-4 font-bold text-slate-200">Quantity</th>
                              <th className="text-left py-4 font-bold text-slate-200">Subtotal</th>
                              <th className="text-left py-4 font-bold text-slate-200">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-400/10">
                            {cart.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-400/5 transition-colors">
                                <td className="py-4">
                                  <span className="font-bold text-slate-200">{item.name}</span>
                                  {item.inventory_quantity !== undefined && item.qty > item.inventory_quantity && (
                                    <p className="text-xs text-amber-400 font-bold mt-1">Only {item.inventory_quantity} units available</p>
                                  )}
                                </td>
                                <td className="py-4 text-slate-400">R{Number(item.price).toLocaleString()}</td>
                                <td className="py-4 text-slate-400 font-bold">{item.qty}</td>
                                <td className="py-4 font-bold text-red-400">R{(item.price * item.qty).toLocaleString()}</td>
                                <td className="py-4">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setCart(prev => prev.filter(cartItem => cartItem.id !== item.id))}
                                    className="text-red-400 hover:text-red-300 font-bold"
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="border-t border-slate-400/30 pt-6">
                        {!pendingOrder ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-400">Cart Summary</p>
                              <p className="text-3xl font-bold text-red-400">R{cartTotal.toLocaleString()}</p>
                              <p className="text-sm text-slate-400 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                            </div>
                            <Button 
                              onClick={() => {
                                if (cart.length > 0) {
                                  setPendingOrder({items: cart, total: cartTotal})
                                }
                              }}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70"
                            >
                              Request to Order
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-slate-400/10 border border-slate-400/20 rounded-lg p-4">
                              <p className="text-sm text-slate-400 mb-2">Order Total</p>
                              <p className="text-3xl font-bold text-red-400 mb-4">R{pendingOrder.total.toLocaleString()}</p>
                              <p className="text-sm text-slate-400 mb-4">Choose your payment method:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button
                                  onClick={() => handlePlaceOrder('payfast')}
                                  disabled={submittingOrder}
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg shadow-green-600/50 hover:shadow-green-600/70 disabled:opacity-50"
                                >
                                  {submittingOrder ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Pay Now'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handlePlaceOrder('credit')}
                                  disabled={submittingOrder}
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 disabled:opacity-50"
                                >
                                  {submittingOrder ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Pay with Credit'
                                  )}
                                </Button>
                              </div>
                              <Button
                                onClick={() => setPendingOrder(null)}
                                variant="ghost"
                                className="w-full mt-3 text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {statsCards.map((stat, idx) => {
                    const Icon = stat.icon
                    return (
                      <div key={idx} className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-6 shadow-xl shadow-red-500/10 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                          </div>
                          <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-8 shadow-xl shadow-red-500/10 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold mb-6 text-white">Recent Orders</h2>
                  {orders.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No recent orders</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-slate-400/30">
                            <th className="text-left py-4 font-bold text-slate-200">Order ID</th>
                            <th className="text-left py-4 font-bold text-slate-200">Date</th>
                            <th className="text-left py-4 font-bold text-slate-200">Status</th>
                            <th className="text-left py-4 font-bold text-slate-200">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-400/10">
                          {orders.slice(0, 5).map((order: any) => (
                            <tr key={order.order_number} className="hover:bg-slate-400/5">
                              <td className="py-4 font-bold text-red-400">{order.order_number}</td>
                              <td className="py-4 text-slate-400">{formatDate(order.order_date)}</td>
                              <td className="py-4"><span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.payment_status)}`}>{order.payment_status}</span></td>
                              <td className="py-4 font-bold text-slate-200">R{Number(order.total_amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shop Catalog Tab */}
            {activeTab === 'shop' && (
              <div className="animate-fade-in-up">
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-400/40 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                  />
                  <p className="text-sm text-slate-400 mt-2">
                    Showing {products.length} of {totalProducts} products
                  </p>
                </div>

                {prodLoading && products.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {products.map((product: any, idx: number) => (
                        <div
                          key={product.id}
                          className="border border-slate-400/40 rounded-lg bg-gradient-to-br from-[#0056a1]/20 to-[#002463]/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 group animate-fade-in-up overflow-hidden flex flex-col h-full"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          {/* Product Image */}
                          <div className="w-full h-40 bg-slate-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                                <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="p-5 flex flex-col h-full">
                            <div className="mb-3">
                              <p className="font-bold text-slate-200">{product.title}</p>
                              <p className="text-xs text-slate-400">{product.sku}</p>
                            </div>
                            <p className="text-sm text-slate-400 mb-4 flex-grow">{product.description}</p>
                            <div className="space-y-3 mt-auto">
                              <div className="flex items-center justify-between">
                                <p className="text-2xl font-bold text-red-400">R{Number(product.price).toLocaleString()}</p>
                                {product.inventory_quantity > 0 ? (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">In Stock ({product.inventory_quantity})</span>
                                ) : (
                                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">Out of Stock</span>
                                )}
                              </div>
                              {product.inventory_quantity > 0 ? (
                                <>
                                  <div className="flex items-center border border-slate-400/50 rounded-lg bg-white/10">
                                    <button
                                      onClick={() => {
                                        setProductQuantities(prev => ({...prev, [product.id]: Math.max(1, (prev[product.id] || 1) - 1)}))
                                        setStockErrors(prev => { const n = {...prev}; delete n[product.id]; return n })
                                      }}
                                      className="px-2 py-1 text-slate-300 hover:text-white font-bold"
                                    >
                                      −
                                    </button>
                                    <span className="px-3 py-1 text-white font-bold min-w-[40px] text-center">
                                      {productQuantities[product.id] || 1}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newQty = (productQuantities[product.id] || 1) + 1
                                        if (newQty > product.inventory_quantity) {
                                          setStockErrors(prev => ({...prev, [product.id]: `Only ${product.inventory_quantity} units available`}))
                                        } else {
                                          setStockErrors(prev => { const n = {...prev}; delete n[product.id]; return n })
                                        }
                                        setProductQuantities(prev => ({...prev, [product.id]: newQty}))
                                      }}
                                      className="px-2 py-1 text-slate-300 hover:text-white font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                  {stockErrors[product.id] && (
                                    <p className="text-xs text-red-400 font-bold">{stockErrors[product.id]}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => addToCart({id: product.id, sku: product.sku, name: product.title, price: Number(product.price), inventory_quantity: product.inventory_quantity})} disabled={cart.some(item => item.id === product.id)} className={`flex-1 font-bold gap-1 ${cart.some(item => item.id === product.id) ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'}`}>
                                      {cart.some(item => item.id === product.id) ? 'In Cart' : 'Add to Cart'}
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => toggleFavorite(product.sku)}
                                      className={`p-2 rounded-lg transition-all transform hover:bg-pink-500/10 ${favorites.has(product.sku) ? 'scale-110 animate-pulse' : 'scale-100 hover:scale-105'}`}
                                      title={favorites.has(product.sku) ? 'Remove from wishlist' : 'Add to wishlist'}
                                    >
                                      <Heart
                                        className={`w-5 h-5 transition-all ${favorites.has(product.sku) ? 'fill-pink-500 text-pink-500' : 'text-slate-300 hover:text-pink-400'}`}
                                      />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex gap-2">
                                  <Button size="sm" disabled className="flex-1 font-bold gap-1 bg-slate-600 text-slate-400 cursor-not-allowed">
                                    Out of Stock
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorite(product.sku)}
                                    className={`p-2 rounded-lg transition-all transform hover:bg-pink-500/10 ${favorites.has(product.sku) ? 'scale-110 animate-pulse' : 'scale-100 hover:scale-105'}`}
                                    title={favorites.has(product.sku) ? 'Remove from wishlist' : 'Add to wishlist'}
                                  >
                                    <Heart
                                      className={`w-5 h-5 transition-all ${favorites.has(product.sku) ? 'fill-pink-500 text-pink-500' : 'text-slate-300 hover:text-pink-400'}`}
                                    />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {hasMore && (
                      <div className="flex justify-center mt-8">
                        <Button
                          onClick={loadMoreProducts}
                          disabled={prodLoading}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold"
                        >
                          {prodLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More Products'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="animate-fade-in-up">
                {favoritesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                  </div>
                ) : favorites.size === 0 ? (
                  <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-12 shadow-xl shadow-red-500/10 backdrop-blur-sm text-center">
                    <Heart className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Wishlist Items</h3>
                    <p className="text-slate-400 mb-6">Add products to your wishlist from the Shop Catalog</p>
                    <Button onClick={() => setActiveTab('shop')} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold">
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.filter((p: any) => favorites.has(p.sku)).map((product: any, idx: number) => (
                      <div
                        key={product.id}
                        className="border border-slate-400/40 rounded-lg bg-gradient-to-br from-[#0056a1]/20 to-[#002463]/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 group animate-fade-in-up overflow-hidden flex flex-col h-full"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="p-5 flex flex-col h-full">
                          <div className="mb-3">
                            <p className="font-bold text-slate-200">{product.title}</p>
                            <p className="text-xs text-slate-400">{product.sku}</p>
                          </div>
                          <p className="text-sm text-slate-400 mb-4 flex-grow">{product.description}</p>
                          <div className="space-y-3 mt-auto">
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-red-400">R{Number(product.price).toLocaleString()}</p>
                              {product.inventory_quantity > 0 ? (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">In Stock ({product.inventory_quantity})</span>
                              ) : (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">Out of Stock</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => addToCart({id: product.id, sku: product.sku, name: product.title, price: Number(product.price), inventory_quantity: product.inventory_quantity})} disabled={cart.some(item => item.id === product.id) || !product.inventory_quantity || product.inventory_quantity === 0} className={`flex-1 font-bold gap-1 ${cart.some(item => item.id === product.id) ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : !product.inventory_quantity || product.inventory_quantity === 0 ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'}`}>
                                {cart.some(item => item.id === product.id) ? 'In Cart' : !product.inventory_quantity || product.inventory_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                              </Button>
                              <button
                                type="button"
                                onClick={() => toggleFavorite(product.sku)}
                                className="p-2 rounded-lg transition-all hover:bg-red-500/20 active:scale-95"
                                title="Remove from wishlist"
                              >
                                <X className="w-5 h-5 text-red-400 hover:text-red-300" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in-up">
                <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-8 shadow-xl shadow-red-500/10 backdrop-blur-sm">
                  <h2 className="text-2xl font-bold mb-6 text-white">Order History</h2>
                  {orders.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No orders found</p>
                  ) : (
                    <div className="space-y-0 border border-slate-400/40 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-400/30 bg-slate-900/20">
                            <th className="text-left py-4 px-6 font-bold text-slate-200">Order #</th>
                            <th className="text-left py-4 px-6 font-bold text-slate-200">Date</th>
                            <th className="text-left py-4 px-6 font-bold text-slate-200">Total</th>
                            <th className="text-left py-4 px-6 font-bold text-slate-200">Status</th>
                            <th className="text-left py-4 px-6 font-bold text-slate-200">Action</th>
                            <th className="text-center py-4 px-6 font-bold text-slate-200">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-400/10">
                          {orders.map((order: any) => {
                            const orderTotal = order.items?.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0) || 0
                            return (
                              <React.Fragment key={order.order_number}>
                                <tr className="hover:bg-slate-400/5 transition-colors">
                                  <td className="py-4 px-6 font-bold text-red-400">{order.order_number}</td>
                                  <td className="py-4 px-6 text-slate-400">{formatDate(order.order_date)}</td>
                                  <td className="py-4 px-6 font-bold text-red-400">R{orderTotal.toLocaleString()}</td>
                                  <td className="py-4 px-6">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                      order.payment_status === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                      order.payment_status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                      order.payment_status === 'Failed' ? 'bg-red-500/20 text-red-400' :
                                      order.payment_status === 'Cancelled' ? 'bg-gray-500/20 text-gray-400' :
                                      'bg-blue-500/20 text-blue-400'
                                    }`}>
                                      {order.payment_status || 'Pending'}
                                    </span>
                                  </td>
                                  {isAdmin && <td className="py-4 px-6"></td>}
                                  <td className="py-4 px-6 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedOrders)
                                        if (newExpanded.has(order.order_number)) {
                                          newExpanded.delete(order.order_number)
                                        } else {
                                          newExpanded.add(order.order_number)
                                        }
                                        setExpandedOrders(newExpanded)
                                      }}
                                      className="p-1 hover:bg-slate-400/20 rounded transition-all"
                                    >
                                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedOrders.has(order.order_number) ? 'rotate-180' : ''}`} />
                                    </button>
                                  </td>
                                </tr>
                                {expandedOrders.has(order.order_number) && order.items && order.items.length > 0 && (
                                  <tr>
                                    <td colSpan={5} className="p-0">
                                      <div className="bg-slate-900/30 border-t border-slate-400/20 p-6 w-full">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="border-b border-slate-400/20">
                                              <th className="text-left py-3 px-4 font-bold text-slate-300">Product Name</th>
                                              <th className="text-left py-3 px-4 font-bold text-slate-300">SKU</th>
                                              <th className="text-left py-3 px-4 font-bold text-slate-300">Quantity</th>
                                              <th className="text-left py-3 px-4 font-bold text-slate-300">Unit Price</th>
                                              <th className="text-left py-3 px-4 font-bold text-slate-300">Tax</th>
                                              <th className="text-left py-3 px-4 font-bold text-slate-300">Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-400/10">
                                            {order.items.map((item: any, idx: number) => (
                                              <tr key={idx} className="hover:bg-slate-400/5">
                                                <td className="py-3 px-4 text-slate-300">{item.products?.title || '-'}</td>
                                                <td className="py-3 px-4 text-slate-400">{item.sku}</td>
                                                <td className="py-3 px-4 text-slate-400">{item.quantity}</td>
                                                <td className="py-3 px-4 text-slate-400">R{Number(item.price).toLocaleString()}</td>
                                                <td className="py-3 px-4 text-slate-400">R{Number(item.tax).toLocaleString()}</td>
                                                <td className="py-3 px-4 font-bold text-red-400">R{(Number(item.price) * item.quantity).toLocaleString()}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
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
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="animate-fade-in-up">
                <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-8 shadow-xl shadow-red-500/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Documents</h2>
                    <Button
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold"
                      onClick={() => setShowUploadModal(true)}
                    >
                      Upload Document
                    </Button>
                  </div>
                  {documents.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No documents available</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-400/40 rounded-lg hover:bg-slate-400/5 transition-all">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-red-400" />
                            <div>
                              <span className="font-bold text-slate-200 block">{doc.file_name}</span>
                              <span className="text-xs text-slate-400">{doc.document_type}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Document Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-md w-full">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Upload Document</h3>
                      <button
                        onClick={() => {
                          setShowUploadModal(false)
                          setUploadDocumentError(null)
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Document Type</label>
                      <select
                        value={selectedDocumentType}
                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                        disabled={uploadingDocument}
                        className="w-full border-slate-400/50 focus:border-red-500 bg-white/10 text-white rounded px-3 py-2 border font-medium"
                      >
                        <option value="Invoice">Invoice</option>
                        <option value="Receipt">Receipt</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Statement">Statement</option>
                        <option value="CreditNote">Credit Note</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Select File (PDF or Image)</label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        disabled={uploadingDocument}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleUploadDocument(file)
                          }
                        }}
                        className="w-full border border-slate-400/50 rounded px-3 py-2 bg-white/10 text-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
                      />
                    </div>

                    {uploadDocumentError && (
                      <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                        {uploadDocumentError}
                      </div>
                    )}

                    {uploadingDocument && (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                        <span className="text-slate-300">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-8 shadow-xl shadow-red-500/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 text-white">Account Information</h3>
                    <div className="space-y-4">
                      <div className="pb-4 border-b border-slate-400/20">
                        <p className="text-sm text-slate-400 font-medium mb-1">Account Number</p>
                        <p className="text-lg font-bold text-slate-200">{client?.account_no || '-'}</p>
                      </div>
                      <div className="pb-4 border-b border-slate-400/20">
                        <p className="text-sm text-slate-400 font-medium mb-1">Full Name</p>
                        <p className="text-lg font-bold text-slate-200">{client?.business_name || client?.client_name || '-'}</p>
                      </div>
                      <div className="pb-4 border-b border-slate-400/20">
                        <p className="text-sm text-slate-400 font-medium mb-1">Address</p>
                        <p className="text-lg font-bold text-slate-200">{client?.address || '-'}</p>
                      </div>
                      <div className="pb-4 border-b border-slate-400/20">
                        <p className="text-sm text-slate-400 font-medium mb-1">Member Since</p>
                        <p className="text-lg font-bold text-slate-200">{client?.created_at ? formatDate(client.created_at) : '-'}</p>
                      </div>
                        <div className="pb-4 border-b border-slate-400/20">
                          <p className="text-sm text-slate-400 font-medium mb-1">Contact Person</p>
                          <p className="text-lg font-bold text-slate-200">{client?.full_name || '-'}</p>
                        </div>
                        <div className="pb-4 border-b border-slate-400/20">
                          <p className="text-sm text-slate-400 font-medium mb-1">Email Address</p>
                          <p className="text-lg font-bold text-slate-200">{client?.email || '-'}</p>
                        </div>
                        <div className="pb-4 border-b border-slate-400/20">
                          <p className="text-sm text-slate-400 font-medium mb-1">Phone Number</p>
                          <p className="text-lg font-bold text-slate-200">{client?.phone_number || '-'}</p>
                        </div>
                      <div>
                        <p className="text-sm text-slate-400 font-medium mb-1">Business Type</p>
                        <p className="text-lg font-bold text-slate-200">{client?.business_type || '-'}</p>
                      </div>
                      {client?.sales_code && (
                        <div>
                          <p className="text-sm text-slate-400 font-medium mb-1">Sales Code</p>
                          <p className="text-lg font-bold text-slate-200">{client.sales_code}</p>
                        </div>
                      )}
                      {client?.salesperson_name && (
                        <div>
                          <p className="text-sm text-slate-400 font-medium mb-1">Salesperson</p>
                          <p className="text-lg font-bold text-slate-200">{client.salesperson_name}</p>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </Button>
                  </div>

                  <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-8 shadow-xl shadow-red-500/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-6 text-white">Security Settings</h3>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-slate-400/40 hover:border-red-500/50 hover:bg-red-500/10 font-bold gap-3 bg-transparent text-slate-200"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-400/20 border border-green-500/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-green-300 mb-1">Account Status</h4>
                      <p className="text-sm text-green-400">Your account is active and in good standing</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600/80 to-red-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-white hover:bg-white/10 rounded p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Contact Person</label>
                  <Input
                    value={editFormData.full_name}
                  onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                  placeholder="Full name"
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="Email address"
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Phone Number</label>
                  <Input
                  value={editFormData.phone_number}
                  onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
                  placeholder="Phone number"
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Business Type</label>
                <select
                  value={editFormData.business_type}
                  onChange={(e) => setEditFormData({...editFormData, business_type: e.target.value})}
                  className="w-full border-slate-400/50 focus:border-red-500 bg-white/10 text-white rounded px-3 py-2 border font-medium"
                >
                  <option value="">Select business type</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Address</label>
                <Input
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  placeholder="Address"
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="border-t border-slate-400/20 pt-4 mt-4">
                <h3 className="text-sm font-bold text-slate-400 mb-3">Account Information (Read-only)</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Account Number</label>
                    <p className="px-3 py-2 bg-slate-700/30 text-slate-300 rounded border border-slate-400/20 font-mono text-sm">{client?.account_no || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Sales Code</label>
                    <p className="px-3 py-2 bg-slate-700/30 text-slate-300 rounded border border-slate-400/20 font-mono text-sm">{client?.sales_code || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Salesperson Name</label>
                    <p className="px-3 py-2 bg-slate-700/30 text-slate-300 rounded border border-slate-400/20 font-mono text-sm">{client?.salesperson_name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50"
                disabled={savingProfile}
                onClick={handleSaveProfile}
              >
                {savingProfile ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600/80 to-red-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className="text-white hover:bg-white/10 rounded p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {passwordSuccess && (
                <div className="bg-green-500/20 border border-green-500/50 rounded p-3">
                  <p className="text-green-300 font-bold text-sm">{passwordSuccess}</p>
                </div>
              )}

              {passwordError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded p-3">
                  <p className="text-red-300 font-bold text-sm">{passwordError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Current Password</label>
                <Input
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">New Password</label>
                <Input
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50"
                disabled={updatingPassword}
                onClick={handleChangePassword}
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
