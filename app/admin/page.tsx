'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LogOut, Package, Users, ShoppingCart, BarChart3, Menu, X, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, Clock, Loader2, Send, Mail, MessageSquare, Check, XCircle, Upload, ImageIcon, TrendingUp, ChevronDown, Lock, Shield, Bell, Database, Globe, Palette, CreditCard, Building2, Settings, User, Search, FileSignature } from 'lucide-react'
import { ReportingDashboard } from '@/components/admin/reporting/reporting-dashboard'
import { CourierQuotePanel } from '@/components/admin/courier/quote-panel'
import { RateCardsPanel } from '@/components/admin/courier/rate-cards-panel'
import { CreditApplicationsPanel } from '@/components/admin/credit-applications-panel'
import { AdminShell } from '@/components/admin/admin-shell'
import { portalFontVars } from '@/components/portal/fonts'
import { buildReportingModel } from '@/lib/admin/reporting'
import { createClient } from '@/lib/supabase/client'

const fetcher = (url: string) => fetch(url).then(res => res.json())
const EMPTY_ARRAY: any[] = []

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `R${(amount / 1_000_000).toFixed(1)}M`
  return `R${Number(amount).toLocaleString()}`
}

function getStoragePathFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url)
    const marker = '/storage/v1/object/public/product-images/'
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex >= 0) {
      return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length))
    }
  } catch {
    // Not a valid absolute URL, fall through to return the raw value.
  }

  const fallbackMarker = 'product-images/'
  const fallbackIndex = url.indexOf(fallbackMarker)
  if (fallbackIndex >= 0) {
    return decodeURIComponent(url.slice(fallbackIndex + fallbackMarker.length))
  }

  return url
}

const getStatusColor = (status: string) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'completed':
    case 'paid':
    case 'approved':
      return 'border-transparent bg-[#E7F4EE] text-[#0B6B41]'
    case 'pending':
    case 'low stock':
      return 'border-transparent bg-[#FFF4DB] text-[#7A4F00]'
    case 'shipped':
      return 'border-transparent bg-[#E6EAF3] text-[#0F1B3D]'
    case 'cancelled':
    case 'failed':
    case 'rejected':
      return 'border-transparent bg-[#FDECEA] text-[#A4161A]'
    default:
      return 'border-transparent bg-[#EEF0F3] text-[#4A515E]'
  }
}

const formatRand = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0)
  const [int, dec] = Math.abs(n).toFixed(2).split('.')
  return `${n < 0 ? '−' : ''}R ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${dec}`
}

export default function AdminPage() {
  const { data: adminData, error: adminError, isLoading, mutate } = useSWR('/api/admin', fetcher)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [creditApplicationId, setCreditApplicationId] = useState<string | null>(null)

  // Deep links such as /admin?tab=credit-applications&id=<uuid> (used in notification emails).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) setActiveTab(tab)
    if (tab === 'credit-applications') setCreditApplicationId(params.get('id'))
  }, [])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showCreateLoginModal, setShowCreateLoginModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productFormData, setProductFormData] = useState<any>({})
  const [createLoginEmail, setCreateLoginEmail] = useState('')
  const [createLoginSearch, setCreateLoginSearch] = useState('')
  
  // Settings modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showEmailSettingsModal, setShowEmailSettingsModal] = useState(false)
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailSettings, setEmailSettings] = useState({ companyName: '', senderEmail: '', senderName: '' })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [createLoginError, setCreateLoginError] = useState('')
  const [createLoginSuccess, setCreateLoginSuccess] = useState('')
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [selectedCustomerForLogin, setSelectedCustomerForLogin] = useState<any>(null)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [productImages, setProductImages] = useState<{[key: string]: string[]}>({})
  const [productGallery, setProductGallery] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [createdLoginCredentials, setCreatedLoginCredentials] = useState<any>(null)
  const [viewingOrder, setViewingOrder] = useState<any>(null)
  const [teamUsers, setTeamUsers] = useState<any[]>([])
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [customerModalTab, setCustomerModalTab] = useState('account')
  
  // Search states
  const [productSearch, setProductSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [approvingCustomer, setApprovingCustomer] = useState<string | null>(null)
  const [rejectingCustomer, setRejectingCustomer] = useState<string | null>(null)
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null)
    const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null)
    const [paymentLinkMethod, setPaymentLinkMethod] = useState<'email' | 'sms'>('email')
    const [sendingPaymentLink, setSendingPaymentLink] = useState(false)
  const [customerFilter, setCustomerFilter] = useState<'All' | 'Active Login' | 'No Login' | 'Pending' | 'Approved' | 'Rejected'>('All')
  const [paymentLinkAmount, setPaymentLinkAmount] = useState('')
  const [paymentLinkNote, setPaymentLinkNote] = useState('')
  const [creatingLogin, setCreatingLogin] = useState<string | null>(null)
  const [productPage, setProductPage] = useState(1)
  const [pagedProducts, setPagedProducts] = useState<any[]>([])
  const [totalProductCount, setTotalProductCount] = useState(0)
  const [productPageLoading, setProductPageLoading] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [addAdminFormData, setAddAdminFormData] = useState({ email: '', full_name: '', password: '' })
  const [addAdminLoading, setAddAdminLoading] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [editingProductSku, setEditingProductSku] = useState<string | null>(null)
  const [editProductData, setEditProductData] = useState<{title: string; product_type: string; description: string; price: string; inventory_quantity: string}>({title: '', product_type: '', description: '', price: '', inventory_quantity: ''})
  const [editProductLoading, setEditProductLoading] = useState(false)
  const [deletingProductImage, setDeletingProductImage] = useState<string | null>(null)
  const [paymentLinkPreview, setPaymentLinkPreview] = useState('')
  const [paymentCustomerSearch, setPaymentCustomerSearch] = useState('')
  const [selectedPaymentCustomer, setSelectedPaymentCustomer] = useState<any>(null)
  const [manualPaymentAmount, setManualPaymentAmount] = useState('')
  const [manualPaymentNote, setManualPaymentNote] = useState('')
  const [manualPaymentLinkPreview, setManualPaymentLinkPreview] = useState('')
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false)
  const [manualPaymentError, setManualPaymentError] = useState<string | null>(null)
  const [manualPaymentSuccess, setManualPaymentSuccess] = useState<string | null>(null)
  const [loginActionLoading, setLoginActionLoading] = useState<'reset' | 'revoke' | null>(null)
  const PRODUCTS_PER_PAGE = 15

  const [customerPage, setCustomerPage] = useState(1)
  const [pagedCustomers, setPagedCustomers] = useState<any[]>([])
  const [totalCustomerCount, setTotalCustomerCount] = useState(0)
  const [customerPageLoading, setCustomerPageLoading] = useState(false)
  const CUSTOMERS_PER_PAGE = 15
  const ORDERS_PER_PAGE = 15
  const [orderPage, setOrderPage] = useState(1)

  const products = adminData?.products || EMPTY_ARRAY
  const clients = adminData?.clients || EMPTY_ARRAY
  const orders = adminData?.orders || EMPTY_ARRAY
  const reporting = buildReportingModel({ orders, clients })
  const stats = adminData?.stats || { totalProducts: 0, activeCustomers: 0, totalOrders: 0, totalRevenue: 0 }
  const paidOrders = orders.filter((order: any) => Number(order.total_amount || 0) > 0)
  const averagePayment = paidOrders.length
    ? paidOrders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0) / paidOrders.length
    : 0
  const activeLoginUsers = clients.filter((client: any) => !!client.user_id).length
  const customersWithPayments = clients.filter((client: any) => Number(client.order_count || 0) > 0).length
  const averagePaymentsPerCustomer = customersWithPayments > 0
    ? orders.length / customersWithPayments
    : 0
  const timeBuckets = orders.reduce((acc: Record<string, number>, order: any) => {
    const date = order.order_date ? new Date(order.order_date) : null
    if (!date || Number.isNaN(date.getTime())) return acc

    const hour = date.getHours()
    const bucket =
      hour >= 5 && hour < 12 ? 'Morning' :
      hour >= 12 && hour < 17 ? 'Afternoon' :
      hour >= 17 && hour < 21 ? 'Evening' :
      'Night'

    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 })
  const peakTimeEntry = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0]
  const peakTimeLabel = peakTimeEntry?.[0] || 'Afternoon'
  const peakTimeShare = orders.length > 0
    ? Math.round(((peakTimeEntry?.[1] || 0) / orders.length) * 100)
    : 0
  const viewingOrderClient = viewingOrder
    ? clients.find((client: any) =>
        String(client.account_no) === String(viewingOrder.client_account_no) ||
        String(client.client_name || '').toLowerCase() === String(viewingOrder.client_name || '').toLowerCase() ||
        String(client.contact?.full_name || '').toLowerCase() === String(viewingOrder.client_name || '').toLowerCase()
      ) || null
    : null
  const viewingOrderEmail = viewingOrder
    ? viewingOrder.client_contact_email ||
      viewingOrder.client_email ||
      viewingOrderClient?.contact?.email ||
      viewingOrderClient?.email ||
      ''
    : ''
  const viewingOrderContactName = viewingOrder
    ? viewingOrderClient?.contact?.full_name ||
      viewingOrderClient?.full_name ||
      viewingOrder.client_name ||
      ''
    : ''

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        status: editingCustomer.status || '',
        client_name: editingCustomer.client_name || '',
        address: editingCustomer.address || '',
        full_name: editingCustomer.full_name || '',
        phone_number: editingCustomer.phone_number || '',
        business_type: editingCustomer.business_type || '',
        email: editingCustomer.email || '',
      })
      setCustomerModalTab('account')
      return
    }

    setFormData({})
  }, [editingCustomer])

  useEffect(() => {
    if (editingProduct) {
      setProductFormData({
        title: editingProduct.title || '',
        sku: editingProduct.sku || '',
        price: String(editingProduct.price ?? ''),
        inventory_quantity: String(editingProduct.inventory_quantity ?? editingProduct.stock ?? ''),
        product_type: editingProduct.product_type || '',
        description: editingProduct.description || '',
      })
      const existingGallery = productImages[editingProduct.sku] || []
      const initialImage = existingGallery[0] || null
      setPreviewImage(initialImage)
      setProductGallery(existingGallery)
      return
    }

    setProductFormData({})
    setPreviewImage(null)
    setProductGallery([])
  }, [editingProduct])

  useEffect(() => {
    setPaymentLinkPreview('')
  }, [viewingOrder?.id])

  useEffect(() => {
    if (activeTab !== 'payment') {
      setPaymentCustomerSearch('')
      setSelectedPaymentCustomer(null)
      setManualPaymentAmount('')
      setManualPaymentNote('')
      setManualPaymentLinkPreview('')
      setManualPaymentError(null)
      setManualPaymentSuccess(null)
      setManualPaymentLoading(false)
    }
  }, [activeTab])

  const statsCards = [
    { label: 'Total products', value: String(stats.totalProducts), icon: Package, color: 'from-blue-500 to-blue-600' },
    { label: 'Active customers', value: String(stats.activeCustomers), icon: Users, color: 'from-green-500 to-green-600' },
    { label: 'Total orders', value: String(stats.totalOrders), icon: ShoppingCart, color: 'from-purple-500 to-purple-600' },
    { label: 'Total revenue', value: formatRand(stats.totalRevenue), icon: TrendingUp, color: 'from-pink-500 to-pink-600' },
  ]

  const handleImageUpload = async (sku: string, files: FileList | File[]) => {
    const fileList = Array.from(files)
    if (!fileList.length) return

    setUploadingImage(sku)
    setImageUploadError(null)
    try {
      const supabase = createClient()
      const existingImages = Array.isArray(productImages[sku]) ? productImages[sku] : []
      const nextGallery = [...existingImages]
      const uploads = await Promise.all(fileList.map(async (file, index) => {
        const filePath = `${sku}/${Date.now()}_${index}_${file.name}`
        const { error: uploadError } = await supabase
          .storage
          .from('product-images')
          .upload(filePath, file, { upsert: true })

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(filePath)

        return {
          product_sku: sku,
          file_name: file.name,
          storage_path: data.publicUrl,
          is_primary: existingImages.length === 0 && index === 0,
          sort_order: existingImages.length + index,
          alt_text: productFormData.title || sku,
        }
      }))

      const insertResponse = await fetch('/api/admin/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: uploads }),
      })

      if (!insertResponse.ok) {
        console.error('[v0] Insert error:', await insertResponse.text())
        setImageUploadError('Failed to save image record')
        return
      }

      uploads.forEach((upload) => nextGallery.push(upload.storage_path))
      const normalizedGallery = Array.from(new Set(nextGallery.filter(Boolean)))
      setProductGallery(normalizedGallery)
      setPreviewImage(normalizedGallery[0] || null)
      setProductImages(prev => ({ ...prev, [sku]: normalizedGallery }))
      mutate()
    } catch (err) {
      console.error('[v0] Error in handleImageUpload:', err)
      setImageUploadError('An error occurred during upload')
    } finally {
      setUploadingImage(null)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const startEditProduct = (product: any) => {
    setEditingProductSku(product.sku)
    setEditProductData({
      title: product.title || '',
      product_type: product.product_type || '',
      description: product.description || '',
      price: String(product.price || ''),
      inventory_quantity: String(product.inventory_quantity || ''),
    })
  }

  const cancelEditProduct = () => {
    setEditingProductSku(null)
    setEditProductData({title: '', product_type: '', description: '', price: '', inventory_quantity: ''})
  }

  // Admin table writes go through the server (RLS blocks browser writes).
  const adminWrite = async (payload: { table: string; action: string; key?: string; values?: Record<string, unknown> }) => {
    const res = await fetch('/api/admin/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Save failed')
    return data
  }

  const handleCopyPassword = async () => {
    if (!createdLoginCredentials?.password) return
    try {
      await navigator.clipboard.writeText(createdLoginCredentials.password)
      alert('Password copied')
    } catch {
      window.prompt('Copy the temporary password', createdLoginCredentials.password)
    }
  }

  const saveEditProduct = async () => {
    if (!editingProductSku) return
    setEditProductLoading(true)
    try {
      await adminWrite({
        table: 'products',
        action: 'update',
        key: editingProductSku,
        values: {
          title: editProductData.title,
          product_type: editProductData.product_type,
          description: editProductData.description,
          price: parseFloat(editProductData.price) || 0,
          inventory_quantity: parseInt(editProductData.inventory_quantity) || 0,
        },
      })
      // Update local state
      setPagedProducts(prev => prev.map(p => 
        p.sku === editingProductSku 
          ? {...p, ...editProductData, price: parseFloat(editProductData.price) || 0, inventory_quantity: parseInt(editProductData.inventory_quantity) || 0}
          : p
      ))
      setEditingProductSku(null)
    } catch (err) {
      console.error('[v0] Error saving product:', err)
      alert(err instanceof Error ? err.message : 'Could not save the product')
    } finally {
      setEditProductLoading(false)
    }
  }

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sku: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await handleImageUpload(sku, files)
    e.target.value = ''
  }

  const handleDeleteProductImage = async (sku: string, imageUrl: string) => {
    setDeletingProductImage(imageUrl)
    try {
      const supabase = createClient()
      const storagePath = getStoragePathFromPublicUrl(imageUrl)

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove([storagePath])
        if (storageError) {
          console.warn('[v0] Could not remove product image file from storage:', storageError)
        }
      }

      const deleteResponse = await fetch('/api/admin/product-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_sku: sku, storage_path: imageUrl }),
      })

      if (!deleteResponse.ok) throw new Error(await deleteResponse.text())

      const nextGallery = (productGallery.length > 0 ? productGallery : (productImages[sku] || [])).filter((item) => item !== imageUrl)

      setProductImages(prev => {
        const updated = { ...prev }
        if (nextGallery.length > 0) {
          updated[sku] = nextGallery
        } else {
          delete updated[sku]
        }
        return updated
      })

      setProductGallery(nextGallery)
      if (previewImage === imageUrl) {
        setPreviewImage(nextGallery[0] || null)
      }

      console.log('[v0] Product image deleted successfully for SKU:', sku)
    } catch (err) {
      console.error('[v0] Error deleting product image:', err)
    } finally {
      setDeletingProductImage(null)
      mutate()
    }
  }

  const filteredPaymentCustomers = clients.filter((client: any) =>
    client.client_name?.toLowerCase().includes(paymentCustomerSearch.toLowerCase()) ||
    client.full_name?.toLowerCase().includes(paymentCustomerSearch.toLowerCase()) ||
    client.account_no?.toLowerCase().includes(paymentCustomerSearch.toLowerCase())
  )

  const handleSendManualPaymentLink = async () => {
    if (!selectedPaymentCustomer?.account_no) {
      setManualPaymentError('Please select a customer first')
      return
    }
    if (!manualPaymentAmount || Number(manualPaymentAmount) <= 0) {
      setManualPaymentError('Please enter a valid amount')
      return
    }

    setManualPaymentLoading(true)
    setManualPaymentError(null)
    setManualPaymentSuccess(null)

    try {
      const response = await fetch('/api/admin/send-manual-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_account_no: selectedPaymentCustomer.account_no,
          customer_name: selectedPaymentCustomer.client_name || selectedPaymentCustomer.full_name || 'Customer',
          customer_email: selectedPaymentCustomer.email || '',
          amount: Number(manualPaymentAmount),
          item_name: `Manual payment for ${selectedPaymentCustomer.client_name || selectedPaymentCustomer.full_name || selectedPaymentCustomer.account_no}`,
          item_description: manualPaymentNote || `Manual payment request for ${selectedPaymentCustomer.client_name || selectedPaymentCustomer.full_name || selectedPaymentCustomer.account_no}`,
          note: manualPaymentNote || '',
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        const detailText = result.details
          ? `: ${typeof result.details === 'string' ? result.details : JSON.stringify(result.details)}`
          : ''
        throw new Error(`${result.error || 'Failed to send payment link'}${detailText}`)
      }

      setManualPaymentLinkPreview(result.paymentUrl || '')
      setManualPaymentSuccess(`Payment link sent to ${result.customer?.email || selectedPaymentCustomer.email || 'customer email'}`)
      setManualPaymentAmount('')
      setManualPaymentNote('')
    } catch (error: any) {
      console.error('[v0] Manual payment send failed:', error)
      setManualPaymentError(error?.message || 'Failed to send payment link')
    } finally {
      setManualPaymentLoading(false)
    }
  }

  const handleResetClientPassword = async () => {
    if (!editingCustomer?.user_id) {
      alert('This customer does not have an active login to reset.')
      return
    }

    const newPassword = Math.random().toString(36).substring(2, 10)
    setLoginActionLoading('reset')
    try {
      const response = await fetch('/api/admin/reset-client-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_no: editingCustomer.account_no,
          newPassword,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      setFormData((prev: any) => ({ ...prev, resetPassword: newPassword }))
      alert(`Password reset successfully. New password: ${newPassword}`)
    } catch (err: any) {
      console.error('[v0] Password reset error:', err)
      alert(`Error resetting password: ${err.message}`)
    } finally {
      setLoginActionLoading(null)
    }
  }

  const handleRevokeClientAccess = async () => {
    if (!editingCustomer?.user_id) {
      alert('This customer does not have an active login to revoke.')
      return
    }

    setLoginActionLoading('revoke')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCustomer.user_id, updates: { status: 'rejected' } }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setFormData((prev: any) => ({ ...prev, revokeAccess: true }))
      setEditingCustomer((prev: any) => prev ? { ...prev, user_id: null, user_status: 'rejected' } : prev)
      mutate()
      alert('Client access revoked successfully.')
    } catch (err: any) {
      console.error('[v0] Error revoking access:', err)
      alert(`Error revoking access: ${err.message}`)
    } finally {
      setLoginActionLoading(null)
    }
  }

  const handleCreateClientLogin = async () => {
    if (!selectedCustomerForLogin) {
      return
    }

    if (!createLoginEmail.trim()) {
      setCreateLoginError('Please enter an email address')
      return
    }

    setCreatingLogin(selectedCustomerForLogin.account_no)
    setCreateLoginError('')
    setCreateLoginSuccess('')

    try {
      const response = await fetch('/api/admin/create-client-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createLoginEmail.trim(),
          account_no: selectedCustomerForLogin.account_no,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create login')
      }

      setCreatedLoginCredentials({
        email: result.email || createLoginEmail.trim(),
        password: result.password || '',
      })
      setCreateLoginSuccess(`Login created for ${selectedCustomerForLogin.client_name || selectedCustomerForLogin.full_name || selectedCustomerForLogin.account_no}`)
      setSelectedCustomerForLogin(null)
      setShowCreateLoginModal(false)
      setCreateLoginEmail('')
      setCreateLoginSearch('')
      mutate()
    } catch (err: any) {
      console.error('[v0] Create login error:', err)
      setCreateLoginError(`Error creating login: ${err.message}`)
    } finally {
      setCreatingLogin(null)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      alert('All password fields are required')
      return
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (passwordFormData.newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }

    setSettingsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: passwordFormData.newPassword })
      if (error) throw error

      // Send email notification
      await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'Change Password', status: 'success' })
      }).catch(err => console.log('[v0] Email notification skipped:', err))

      alert('Password changed successfully!')
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowChangePasswordModal(false)
    } catch (err: any) {
      console.error('[v0] Password change error:', err)
      alert('Error changing password: ' + err.message)
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleSaveEmailSettings = async () => {
    if (!emailSettings.companyName || !emailSettings.senderEmail) {
      alert('Company name and sender email are required')
      return
    }

    setSettingsLoading(true)
    try {
      // Save to localStorage or a settings API
      localStorage.setItem('emailSettings', JSON.stringify(emailSettings))
      
      // Send email notification
      await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'Update Email Settings', 
          status: 'success',
          settings: emailSettings 
        })
      }).catch(err => console.log('[v0] Email notification skipped:', err))

      alert('Email settings saved successfully!')
      setShowEmailSettingsModal(false)
    } catch (err: any) {
      console.error('[v0] Email settings error:', err)
      alert('Error saving settings: ' + err.message)
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleDeleteProduct = async (sku: string) => {
    setDeletingProduct(sku)
    try {
      await adminWrite({ table: 'products', action: 'delete', key: sku })
      setPagedProducts((prev) => prev.filter((p) => p.sku !== sku))
      mutate()
    } catch (err) {
      console.error('[v0] Error deleting product:', err)
      alert(err instanceof Error ? err.message : 'Could not delete the product')
    } finally {
      setDeletingProduct(null)
    }
  }

  const handleSaveProduct = async () => {
    setSavingProduct(true)
    try {
      if (editingProduct) {
        await adminWrite({ table: 'products', action: 'update', key: editingProduct.sku, values: productFormData })
      } else {
        await adminWrite({ table: 'products', action: 'insert', values: productFormData })
      }
      mutate()
      setEditingProduct(null)
      setShowAddProductModal(false)
      setProductFormData({})
    } catch (err) {
      console.error('[v0] Error saving product:', err)
      alert(err instanceof Error ? err.message : 'Could not save the product')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleApproveCustomer = async (customer: any) => {
    setApprovingCustomer(customer.account_no)
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.user_id, updates: { status: 'approved' } }),
      })
      mutate()
    } catch (err) {
      console.error('[v0] Error approving customer:', err)
    } finally {
      setApprovingCustomer(null)
    }
  }

  const handleRejectCustomer = async (customer: any) => {
    setRejectingCustomer(customer.account_no)
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.user_id, updates: { status: 'rejected' } }),
      })
      mutate()
    } catch (err) {
      console.error('[v0] Error rejecting customer:', err)
    } finally {
      setRejectingCustomer(null)
    }
  }

  const handleOrderStatusChange = async (orderNumber: string, newStatus: string) => {
    setUpdatingOrderStatus(orderNumber)
    try {
      await adminWrite({ table: 'orders', action: 'update', key: orderNumber, values: { payment_status: newStatus } })
      setStatusUpdateSuccess(orderNumber)
      setTimeout(() => setStatusUpdateSuccess(null), 2000)
      mutate()
    } catch (err) {
      console.error('[v0] Error updating order status:', err)
      alert(err instanceof Error ? err.message : 'Could not update the order status')
    } finally {
      setUpdatingOrderStatus(null)
    }
  }

  const filteredCustomers = pagedCustomers.filter((customer: any) => {
    // Apply login status filter
    if (customerFilter === 'Active Login' && !customer.user_id) return false
    if (customerFilter === 'No Login' && customer.user_id) return false
    if (customerFilter === 'Pending' && customer.status !== 'pending') return false
    if (customerFilter === 'Approved' && customer.status !== 'approved') return false
    if (customerFilter === 'Rejected' && customer.status !== 'rejected') return false
    return true
  })

  // Reset to page 1 when search changes for customers
  useEffect(() => {
    setCustomerPage(1)
  }, [searchTerm])

  useEffect(() => {
    setPagedCustomers(clients)
    setTotalCustomerCount(clients.length)
    setCustomerPageLoading(false)
  }, [clients])

  const filteredOrders = orders.filter((o: any) =>
    o.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProducts = pagedProducts

  // Reset to page 1 when search changes
  useEffect(() => {
    setProductPage(1)
  }, [searchTerm])

  useEffect(() => {
    const fetchPagedProducts = async () => {
      setProductPageLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(productPage),
          ...(productSearchTerm && { search: productSearchTerm })
        })
        const response = await fetch(`/api/admin?${params}`)
        const result = await response.json()
        
        if (result.error) {
          console.error('[v0] Error fetching products:', result.error)
          return
        }
        setPagedProducts(result.products || [])
        setTotalProductCount(result.productsTotal || 0)
      } catch (err) {
        console.error('[v0] Error in fetchPagedProducts:', err)
      } finally {
        setProductPageLoading(false)
      }
    }

    fetchPagedProducts()
  }, [productPage, productSearchTerm])

  // Fetch primary images for products
  useEffect(() => {
    const fetchProductImages = async () => {
      if (pagedProducts.length === 0) return
      try {
        const skus = pagedProducts.map((p: any) => p.sku)
        const response = await fetch(`/api/admin/product-images?skus=${encodeURIComponent(skus.join(','))}`)
        if (!response.ok) {
          console.error('[v0] Error fetching product images:', await response.text())
          return
        }
        const { images: data } = await response.json()
        const imageMap: {[sku: string]: string[]} = {}
        data?.forEach((img: any) => {
          if (!imageMap[img.product_sku]) {
            imageMap[img.product_sku] = []
          }
          imageMap[img.product_sku].push(img.storage_path)
        })
        setProductImages(imageMap)
      } catch (err) {
        console.error('[v0] Error in fetchProductImages:', err)
      }
    }
    fetchProductImages()
  }, [pagedProducts])

  // Fetch team users on component mount
  useEffect(() => {
    const fetchTeamUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        if (!response.ok) {
          console.error('[v0] Error fetching team users:', await response.text())
          return
        }
        const { users: data } = await response.json()
        setTeamUsers(data || [])
      } catch (err) {
        console.error('[v0] Error in fetchTeamUsers:', err)
      }
    }

    fetchTeamUsers()
  }, [])

  // Fetch product images on component mount
  useEffect(() => {
    const fetchProductImages = async () => {
      try {
        const response = await fetch('/api/admin/product-images')
        if (!response.ok) {
          console.error('[v0] Error fetching product images:', await response.text())
          return
        }
        const { images: data } = await response.json()

        // Map images by SKU
        const imageMap: {[key: string]: string[]} = {}
        data?.forEach((img: any) => {
          if (!imageMap[img.product_sku]) {
            imageMap[img.product_sku] = []
          }
          imageMap[img.product_sku].push(img.storage_path)
        })
        setProductImages(imageMap)
      } catch (err) {
        console.error('[v0] Error in fetchProductImages:', err)
      }
    }

    if (products.length > 0) {
      fetchProductImages()
    }
  }, [products])

  // Fetch team users on mount
  useEffect(() => {
    const fetchTeamUsers = async () => {
      try {
        const response = await fetch('/api/admin/users?role=admin')
        if (!response.ok) {
          console.error('[v0] Error fetching team users:', await response.text())
          return
        }
        const { users } = await response.json()
        setTeamUsers(users || [])
      } catch (err) {
        console.error('[v0] Error in fetchTeamUsers:', err)
      }
    }
    fetchTeamUsers()
  }, [])

  if (isLoading) {
    return (
      <div className={`kbc-portal ${portalFontVars} flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F4F5F7]`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#0F1B3D]" />
        <p className="text-sm font-medium text-[#5A6272]">Loading admin workspace…</p>
      </div>
    )
  }

  return (
    <AdminShell active={activeTab} onNavigate={setActiveTab} onLogout={handleLogout}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-1.5">
                    <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-[34px]">Overview</h1>
                    <p className="text-sm text-[#5A6272]">Products, customers, orders and payments across the business</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('customers')}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#CBD2DD] bg-white px-4 text-sm font-semibold hover:bg-[#F4F5F7]"
                    >
                      <Users className="h-4 w-4" /> Customers
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-[#C8102E] px-4 text-sm font-semibold text-white hover:bg-[#A50D26]"
                    >
                      <ShoppingCart className="h-4 w-4" /> Review orders
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                  {[
                    ...statsCards.map((s) => ({ ...s, helper: '' })),
                    {
                      label: 'Average payment',
                      value: formatRand(averagePayment),
                      helper: `${orders.length} payments`,
                      icon: CreditCard,
                    },
                    { label: 'Customer logins', value: String(activeLoginUsers), helper: 'Customers who can sign in', icon: Users },
                    {
                      label: 'Payments per customer',
                      value: averagePaymentsPerCustomer.toFixed(1),
                      helper: `${customersWithPayments} paying customers`,
                      icon: ShoppingCart,
                    },
                    { label: 'Busiest time', value: peakTimeLabel, helper: `${peakTimeShare}% of orders`, icon: Clock },
                  ].map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="flex flex-col gap-2.5 rounded-lg border border-[#E3E6EC] bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-medium text-[#5A6272]">{stat.label}</span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EEF1F6] text-[#0F1B3D]">
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <span className="kbc-mono break-words text-xl font-medium tracking-tight sm:text-[26px] sm:leading-8">{stat.value}</span>
                        {stat.helper && <span className="text-xs text-[#5A6272]">{stat.helper}</span>}
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                  <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white">
                    <div className="flex items-center justify-between px-5 py-4">
                      <h2 className="kbc-display text-[17px] font-semibold">Recent orders</h2>
                      <button type="button" onClick={() => setActiveTab('orders')} className="text-sm font-medium text-[#1D3A8A] hover:text-[#132A6B]">
                        All orders
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-[#5A6272]">
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5">Order</th>
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5">Customer</th>
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5">Payment</th>
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 6).map((order: any) => (
                            <tr key={order.order_number}>
                              <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-3 font-medium">{order.order_number}</td>
                              <td className="border-b border-[#EEF0F3] px-4 py-3">
                                <span className="block max-w-[220px] truncate">{order.client_name || '—'}</span>
                                <span className="text-xs text-[#5A6272]">{order.item_count} items</span>
                              </td>
                              <td className="border-b border-[#EEF0F3] px-4 py-3">
                                <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-semibold ${getStatusColor(order.payment_status)}`}>
                                  {order.payment_status || 'Pending'}
                                </span>
                              </td>
                              <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-3 text-right font-medium">{formatRand(order.total_amount)}</td>
                            </tr>
                          ))}
                          {orders.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-10 text-center text-[#5A6272]">No orders yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-lg border border-[#E3E6EC] bg-white">
                    <div className="flex items-center justify-between px-5 py-4">
                      <h2 className="kbc-display text-[17px] font-semibold">Top customers</h2>
                      <button type="button" onClick={() => setActiveTab('customers')} className="text-sm font-medium text-[#1D3A8A] hover:text-[#132A6B]">
                        All customers
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-[#5A6272]">
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5">Customer</th>
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5">Account</th>
                            <th className="border-y border-[#E3E6EC] bg-[#F8F9FB] px-4 py-2.5 text-right">Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clients
                            .filter((c: any) => c.order_count > 0)
                            .sort((x: any, y: any) => y.order_count - x.order_count)
                            .slice(0, 6)
                            .map((customer: any) => (
                              <tr key={customer.account_no}>
                                <td className="border-b border-[#EEF0F3] px-4 py-3 font-medium">
                                  <span className="block max-w-[260px] truncate">{customer.client_name}</span>
                                </td>
                                <td className="kbc-mono whitespace-nowrap border-b border-[#EEF0F3] px-4 py-3 text-[13px] text-[#5A6272]">{customer.account_no}</td>
                                <td className="kbc-mono border-b border-[#EEF0F3] px-4 py-3 text-right">{customer.order_count}</td>
                              </tr>
                            ))}
                          {!clients.some((c: any) => c.order_count > 0) && (
                            <tr>
                              <td colSpan={3} className="px-4 py-10 text-center text-[#5A6272]">No customer orders yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* Reporting Tab */}
            {activeTab === 'reporting' && (
              <ReportingDashboard orders={orders} clients={clients} reporting={reporting} />
            )}

            {activeTab === 'quote' && <CourierQuotePanel />}

            {activeTab === 'rate-cards' && <RateCardsPanel />}

            {activeTab === 'credit-applications' && <CreditApplicationsPanel initialId={creditApplicationId} />}

            {/* Products Tab */}
            {activeTab === 'products' && (() => {
              const filteredProducts = products.filter((p: any) => 
                p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.description?.toLowerCase().includes(productSearch.toLowerCase())
              )
              const totalProductPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
              const paginatedProducts = filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE)
              
              return (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-[34px]">Products</h1>
                    <p className="text-[#5A6272]">Manage your product catalog</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => { setProductSearch(e.target.value); setProductPage(1) }}
                      className="w-64 bg-white border-[#E3E6EC]"
                    />
                    <Button
                      onClick={() => { window.location.href = '/admin/bulk-images' }}
                      variant="outline"
                      className="border-[#E3E6EC] text-[#121826] font-bold gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Images
                    </Button>
                    <Button
                      onClick={() => setShowAddProductModal(true)}
                      className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </Button>
                  </div>
                </div>

                <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#F8F9FB] border-b border-[#E3E6EC]">
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Image</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">SKU</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Price</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Stock</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF0F3]">
                        {paginatedProducts.map((product: any) => (
                          <tr key={product.sku} className="hover:bg-[#F4F5F7] transition-colors">
                            <td className="py-3 px-4">
                              {productImages[product.sku]?.[0] ? (
                                <img src={productImages[product.sku][0]} alt="" className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-[#EEF0F3] rounded flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-[#5A6272]" />
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-sm text-[#121826]">{product.sku}</td>
                            <td className="py-3 px-4 text-[#121826]">{product.description}</td>
                            <td className="py-3 px-4 text-[#121826]">R{product.price?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-[#121826]">{product.inventory_quantity ?? 'N/A'}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setEditingProduct(product)}
                                  className="text-[#1D3A8A] hover:text-[#132A6B] hover:bg-[#F4F5F7]"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteProduct(product.sku)}
                                  className="text-red-500 hover:text-[#A4161A] hover:bg-[#F4F5F7]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalProductPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6EC]">
                      <p className="text-sm text-[#5A6272]">
                        Showing {((productPage - 1) * PRODUCTS_PER_PAGE) + 1} to {Math.min(productPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductPage(p => Math.max(1, p - 1))}
                          disabled={productPage === 1}
                          className="border-[#E3E6EC]"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-[#5A6272]">Page {productPage} of {totalProductPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
                          disabled={productPage === totalProductPages}
                          className="border-[#E3E6EC]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )
            })()}

            {/* Customers Tab */}
            {activeTab === 'customers' && (() => {
              const filteredCustomers = pagedCustomers.filter((c: any) => 
                c.account_no?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.client_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.phone_number?.toLowerCase().includes(customerSearch.toLowerCase())
              )
              const totalCustomerPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE)
              const paginatedCustomers = filteredCustomers.slice((customerPage - 1) * CUSTOMERS_PER_PAGE, customerPage * CUSTOMERS_PER_PAGE)
              
              return (
              <div id="customers" className="space-y-6 scroll-mt-24 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-[34px]">Customers</h1>
                    <p className="text-[#5A6272]">Manage customer accounts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setCustomerPage(1) }}
                      className="w-64 bg-white border-[#E3E6EC]"
                    />
                    <Button 
                      onClick={() => {
                        setCreateLoginSearch('')
                        setCreateLoginError('')
                        setCreateLoginSuccess('')
                        setShowCreateLoginModal(true)
                      }}
                      className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Login
                    </Button>
                  </div>
                </div>

                <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#F8F9FB] border-b border-[#E3E6EC]">
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Account #</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Email</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Phone</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF0F3]">
                        {paginatedCustomers.map((client: any) => (
                          <tr key={client.account_no} className="hover:bg-[#F4F5F7] transition-colors">
                            <td className="py-3 px-4 font-mono text-sm text-[#121826]">{client.account_no}</td>
                            <td className="py-3 px-4 text-[#121826]">{client.client_name || client.full_name || '-'}</td>
                            <td className="py-3 px-4 text-[#121826]">{client.email || '-'}</td>
                            <td className="py-3 px-4 text-[#121826]">{client.phone_number || '-'}</td>
                            <td className="py-3 px-4">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingCustomer(client)}
                                className="text-[#1D3A8A] hover:text-[#132A6B] hover:bg-[#F4F5F7]"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalCustomerPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6EC]">
                      <p className="text-sm text-[#5A6272]">
                        Showing {((customerPage - 1) * CUSTOMERS_PER_PAGE) + 1} to {Math.min(customerPage * CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                          disabled={customerPage === 1}
                          className="border-[#E3E6EC]"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-[#5A6272]">Page {customerPage} of {totalCustomerPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                          disabled={customerPage === totalCustomerPages}
                          className="border-[#E3E6EC]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )
            })()}

            {/* Orders Tab */}
            {activeTab === 'orders' && (() => {
              const filteredOrders = orders.filter((o: any) => 
                o.order_number?.toString().toLowerCase().includes(orderSearch.toLowerCase()) ||
                o.client_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                o.client_account_no?.toLowerCase().includes(orderSearch.toLowerCase())
              )
              const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
              const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE)
              
              return (
              <div id="orders" className="space-y-6 scroll-mt-24 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-[34px]">Orders</h1>
                    <p className="text-[#5A6272]">Manage customer orders</p>
                  </div>
                  <Input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1) }}
                    className="w-64 bg-white border-[#E3E6EC]"
                  />
                </div>

                <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#F8F9FB] border-b border-[#E3E6EC]">
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider w-12"></th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Order #</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Customer</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Date</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Items</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Total</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-[#5A6272] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF0F3]">
                        {paginatedOrders.map((order: any) => (
                          <React.Fragment key={order.order_number}>
                            <tr className="hover:bg-[#F4F5F7] transition-colors">
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedOrders)
                                    if (newExpanded.has(order.order_number)) {
                                      newExpanded.delete(order.order_number)
                                    } else {
                                      newExpanded.add(order.order_number)
                                    }
                                    setExpandedOrders(newExpanded)
                                  }}
                                  className="p-1 hover:bg-[#F4F5F7] rounded transition-all"
                                >
                                  <ChevronDown className={`w-5 h-5 text-[#121826] transition-transform ${expandedOrders.has(order.order_number) ? 'rotate-180' : ''}`} />
                                </button>
                              </td>
                              <td className="py-4 kbc-mono font-semibold text-[#121826]">{order.order_number}</td>
                              <td className="py-4 text-[#121826]">
                                <div className="text-sm">
                                  <p className="font-bold">{order.client_name}</p>
                                  <p className="text-xs text-[#5A6272]">{order.client_account_no}</p>
                                </div>
                              </td>
                              <td className="py-4 text-[#121826]">{order.client_name}</td>
                              <td className="py-4 text-[#5A6272] text-xs">{formatDate(order.order_date)}</td>
                              <td className="py-4 text-[#5A6272]">{order.order_items?.length || 0}</td>
                              <td className="py-4 font-bold text-[#121826]">R{Number(order.total_amount).toLocaleString()}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={order.payment_status}
                                    onChange={(e) => handleOrderStatusChange(order.order_number, e.target.value)}
                                    disabled={updatingOrderStatus === order.order_number}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${getStatusColor(order.payment_status)} disabled:opacity-50`}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Failed">Failed</option>
                                  </select>
                                  {statusUpdateSuccess === order.order_number && (
                                    <Check className="w-4 h-4 text-[#0B6B41]" />
                                  )}
                                </div>
                              </td>
                              <td className="py-4">
                                <Button size="sm" variant="ghost" className="text-[#1D3A8A] hover:text-[#132A6B] font-bold" onClick={() => setViewingOrder(order)}>
                                  View
                                </Button>
                              </td>
                            </tr>
                            {expandedOrders.has(order.order_number) && (
                              <tr>
                                <td colSpan={9} className="p-0">
                                  <div className="bg-[#F8F9FB] border-t border-[#E3E6EC] p-6">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-[#E3E6EC]">
                                          <th className="text-left py-3 px-4 font-bold text-[#121826]">Product Name</th>
                                          <th className="text-left py-3 px-4 font-bold text-[#121826]">SKU</th>
                                          <th className="text-left py-3 px-4 font-bold text-[#121826]">Quantity</th>
                                          <th className="text-left py-3 px-4 font-bold text-[#121826]">Unit Price</th>
                                          <th className="text-left py-3 px-4 font-bold text-[#121826]">Tax</th>
                                          <th className="text-left py-3 px-4 font-bold text-[#121826]">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#EEF0F3]">
                                        {order.order_items?.map((item: any, idx: number) => (
                                          <tr key={idx} className="hover:bg-[#F4F5F7]">
                                            <td className="py-3 px-4 text-[#121826]">{item.products?.title || 'Unknown'}</td>
                                            <td className="py-3 px-4 text-[#5A6272] font-mono">{item.sku}</td>
                                            <td className="py-3 px-4 text-[#5A6272]">{item.quantity}</td>
                                            <td className="py-3 px-4 text-[#121826]">R{Number(item.price).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-[#121826]">R{Number(item.tax).toLocaleString()}</td>
                                            <td className="py-3 px-4 font-bold text-[#121826]">R{(Number(item.price) * item.quantity + Number(item.tax)).toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalOrderPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6EC]">
                      <p className="text-sm text-[#5A6272]">
                        Showing {((orderPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(orderPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                          disabled={orderPage === 1}
                          className="border-[#E3E6EC]"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-[#5A6272]">Page {orderPage} of {totalOrderPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))}
                          disabled={orderPage === totalOrderPages}
                          className="border-[#E3E6EC]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )
            })()}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-[34px]">Payment</h1>
                    <p className="text-[#5A6272]">Send a manual PayFast payment link by customer name</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-500 text-[#A4161A] hover:bg-[#F4F5F7] font-bold bg-transparent gap-2"
                    onClick={() => {
                      setPaymentCustomerSearch('')
                      setSelectedPaymentCustomer(null)
                      setManualPaymentAmount('')
                      setManualPaymentNote('')
                      setManualPaymentLinkPreview('')
                      setManualPaymentError(null)
                      setManualPaymentSuccess(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
                  <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-[#3D4452] mb-2">Search Customer by Name</label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6272]" />
                        <Input
                          value={paymentCustomerSearch}
                          onChange={(e) => {
                            setPaymentCustomerSearch(e.target.value)
                            setManualPaymentSuccess(null)
                          }}
                          placeholder="Type a customer name..."
                          className="pl-10 border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold mb-3">Matching Customers</p>
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {filteredPaymentCustomers.length > 0 ? filteredPaymentCustomers.map((customer: any) => {
                          const isSelected = selectedPaymentCustomer?.account_no === customer.account_no
                          return (
                            <button
                              key={customer.account_no}
                              type="button"
                              onClick={() => {
                                setSelectedPaymentCustomer(customer)
                                setManualPaymentSuccess(null)
                                setManualPaymentError(null)
                                setManualPaymentLinkPreview('')
                              }}
                              className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                                isSelected
                                  ? 'border-red-500 bg-[#FDECEA]'
                                  : 'border-[#E3E6EC] hover:border-[#E8A5A5] hover:bg-[#F4F5F7]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-[#121826]">{customer.client_name || customer.full_name || 'Unnamed customer'}</p>
                                  <p className="text-xs text-[#5A6272]">{customer.account_no}</p>
                                  <p className="text-xs text-[#3D4452] mt-1 break-all">{customer.email || customer.contact?.email || 'No email on file'}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#A4161A] mt-1" />}
                              </div>
                            </button>
                          )
                        }) : (
                          <div className="rounded-lg border border-dashed border-[#E3E6EC] px-4 py-8 text-center text-[#5A6272]">
                            No customers match this name.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E3E6EC] rounded-lg p-6 space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold">Selected Customer</p>
                      <p className="text-xl font-bold text-[#121826] mt-2">
                        {selectedPaymentCustomer?.client_name || selectedPaymentCustomer?.full_name || 'No customer selected'}
                      </p>
                      <p className="text-sm text-[#5A6272] mt-1">{selectedPaymentCustomer?.account_no || 'Search and select a customer'}</p>
                      <p className="text-sm text-[#3D4452] mt-1 break-all">{selectedPaymentCustomer?.email || selectedPaymentCustomer?.contact?.email || 'No email on file yet'}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#3D4452] mb-2">Amount (R)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={manualPaymentAmount}
                          onChange={(e) => setManualPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3D4452] mb-2">Note / Description</label>
                        <Textarea
                          value={manualPaymentNote}
                          onChange={(e) => setManualPaymentNote(e.target.value)}
                          placeholder="Optional note to include in the email"
                          className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold">From</p>
                        <p className="text-sm text-[#121826] font-medium break-all">kbc@notification.leadsync.co.za</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold mb-1">Link</p>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 rounded-md border border-[#E3E6EC] bg-[#F8F9FB] px-3 py-2 text-sm text-[#121826] break-all">
                            {manualPaymentLinkPreview || 'Will be generated when you click Send Payment Link'}
                          </div>
                          {manualPaymentLinkPreview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                              onClick={() => navigator.clipboard.writeText(manualPaymentLinkPreview)}
                            >
                              Copy
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {manualPaymentError && (
                      <p className="text-sm text-[#A4161A] font-medium">{manualPaymentError}</p>
                    )}
                    {manualPaymentSuccess && (
                      <p className="text-sm text-[#0B6B41] font-medium">{manualPaymentSuccess}</p>
                    )}

                    <Button
                      className="bg-[#C8102E] hover:bg-[#A50D26] w-full text-white font-bold transition-all gap-2"
                      disabled={manualPaymentLoading || !selectedPaymentCustomer || !manualPaymentAmount}
                      onClick={handleSendManualPaymentLink}
                    >
                      <Mail className="w-4 h-4" />
                      {manualPaymentLoading ? 'Sending...' : 'Send Payment Link'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h1 className="kbc-display text-[26px] font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-[34px]">Settings</h1>
                  <p className="text-[#5A6272]">Manage your account and system preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Security Settings Card */}
                  <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden">
                    <div className="bg-[#F8F9FB] px-6 py-4 border-b border-[#E3E6EC]">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#EEF1F6] text-[#0F1B3D] w-10 h-10 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-[#121826]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#121826]">Security</h3>
                          <p className="text-xs text-[#5A6272]">Password & authentication</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <button 
                        onClick={() => setShowChangePasswordModal(true)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg bg-white hover:bg-[#F4F5F7] border border-[#E3E6EC] hover:border-[#E3E6EC] transition-all group"
                      >
                        <div className="w-10 h-10 bg-[#F8F9FB] rounded-lg flex items-center justify-center group-hover:bg-[#E6EAF3] transition-colors">
                          <Lock className="w-5 h-5 text-[#0F1B3D]" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-[#121826]">Change Password</p>
                          <p className="text-xs text-[#5A6272]">Update your account password</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-[#5A6272] -rotate-90" />
                      </button>
                    </div>
                  </div>

                  {/* Email Settings Card */}
                  <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden">
                    <div className="bg-[#F8F9FB] px-6 py-4 border-b border-[#E3E6EC]">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#EEF1F6] text-[#0F1B3D] w-10 h-10 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-[#121826]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#121826]">Notifications</h3>
                          <p className="text-xs text-[#5A6272]">Email & alerts configuration</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <button 
                        onClick={() => setShowEmailSettingsModal(true)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg bg-white hover:bg-[#F4F5F7] border border-[#E3E6EC] hover:border-[#E3E6EC] transition-all group"
                      >
                        <div className="w-10 h-10 bg-[#E6EAF3] rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                          <Bell className="w-5 h-5 text-[#0F1B3D]" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-[#121826]">Email Settings</p>
                          <p className="text-xs text-[#5A6272]">Configure notification emails</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-[#5A6272] -rotate-90" />
                      </button>
                    </div>
                  </div>

                  {/* Company Info Card */}
                  <div className="bg-white border border-[#E3E6EC] rounded-lg overflow-hidden">
                    <div className="bg-[#F8F9FB] px-6 py-4 border-b border-[#E3E6EC]">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#EEF1F6] text-[#0F1B3D] w-10 h-10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#121826]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#121826]">Company</h3>
                          <p className="text-xs text-[#5A6272]">Business information</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-[#E3E6EC]">
                          <span className="text-[#5A6272]">Company Name</span>
                          <span className="font-semibold text-[#121826]">KBC Trading</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-[#E3E6EC]">
                          <span className="text-[#5A6272]">Support Email</span>
                          <span className="font-semibold text-[#121826]">support@kbc.co.za</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[#5A6272]">Version</span>
                          <span className="font-semibold text-[#0B6B41]">v1.0.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CRM Insights */}
                <div className="bg-white rounded-lg border border-[#E3E6EC] p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272] mb-2">CRM insights</p>
                      <h3 className="text-lg font-bold text-[#121826]">Operational Signals</h3>
                    </div>
                    <Database className="h-5 w-5 text-[#5A6272]" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: 'Average Payment',
                        value: `R${averagePayment.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
                        helper: `${orders.length} payments captured`,
                        icon: CreditCard,
                        color: 'from-emerald-500 to-emerald-600',
                      },
                      {
                        label: 'No. of Users',
                        value: String(activeLoginUsers),
                        helper: 'Customers with active logins',
                        icon: Users,
                        color: 'from-blue-500 to-blue-600',
                      },
                      {
                        label: 'Avg Payments / Customer',
                        value: averagePaymentsPerCustomer.toFixed(1),
                        helper: `${customersWithPayments} customers placing orders`,
                        icon: ShoppingCart,
                        color: 'from-purple-500 to-purple-600',
                      },
                      {
                        label: 'Peak Time of Day',
                        value: peakTimeLabel,
                        helper: `${peakTimeShare}% of all orders`,
                        icon: Clock,
                        color: 'from-pink-500 to-pink-600',
                      },
                    ].map((stat, idx) => {
                      const Icon = stat.icon
                      return (
                        <div
                          key={stat.label}
                          className="group rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#E8A5A5] hover:bg-white/[0.08]"
                          style={{ animationDelay: `${idx * 0.08}s` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.08em] text-[#5A6272]">{stat.label}</p>
                              <p className="mt-3 text-3xl font-semibold text-[#121826]">{stat.value}</p>
                              <p className="mt-2 text-sm text-[#5A6272]">{stat.helper}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#EEF1F6] text-[#0F1B3D]">
                              <Icon className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

      {/* Customer Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-[#0F1B3D]/45 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E3E6EC] rounded-lg w-full max-w-4xl my-8">
            {/* Modal Header */}
            <div className="bg-white text-[#121826] sticky top-0 px-8 py-6 border-b border-[#E3E6EC] flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold">Edit Account Details</h2>
                <p className="text-sm text-[#A4161A]">{editingCustomer.account_no}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#F4F5F7] text-[#121826]"
                onClick={() => setEditingCustomer(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-[#E3E6EC] bg-[#F8F9FB]">
              <div className="flex gap-1 px-8 overflow-x-auto">
                {[
                  { id: 'account', label: 'Account' },
                  { id: 'contact', label: 'Contact' },
                  { id: 'login', label: 'Login' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCustomerModalTab(tab.id)}
                    className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
                      customerModalTab === tab.id
                        ? 'border-red-500 text-[#A4161A]'
                        : 'border-transparent text-[#5A6272] hover:text-[#121826]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Account Tab */}
              {customerModalTab === 'account' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#3D4452] mb-2">Account No</label>
                      <Input value={editingCustomer.account_no} className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" readOnly />
                    </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Status</label>
                    <select 
                        value={formData.status ?? editingCustomer.status ?? ''} 
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] rounded px-3 py-2 border font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Client Name</label>
                    <Input 
                      value={formData.client_name ?? editingCustomer.client_name ?? ''} 
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Address</label>
                    <Input 
                      value={formData.address ?? editingCustomer.address ?? ''} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                    />
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {customerModalTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Full Name</label>
                    <Input 
                      value={formData.full_name ?? editingCustomer.full_name ?? ''} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Phone Number</label>
                    <Input 
                      value={formData.phone_number ?? editingCustomer.phone_number ?? ''} 
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Business Type</label>
                    <Input 
                      value={formData.business_type ?? editingCustomer.business_type ?? ''} 
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3D4452] mb-2">Email</label>
                    <Input 
                      type="email"
                      value={formData.email ?? editingCustomer.email ?? ''} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                    />
                  </div>
                </div>
              )}

              {/* Login Tab */}
              {customerModalTab === 'login' && (
                <div className="space-y-4">
                  {!editingCustomer.user_id ? (
                    <>
                      <div className="bg-[#E6EAF3] border border-[#E3E6EC] rounded-lg p-4 mb-4">
                        <p className="text-[#0F1B3D] text-sm">This customer has no login yet. Create one below.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3D4452] mb-2">Email</label>
                        <Input 
                          type="email"
                          placeholder="customer@example.com"
                          value={formData.loginEmail || ''} 
                          onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                          className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3D4452] mb-2">Password</label>
                        <div className="flex gap-2 mb-2">
                          <Input 
                            type="text"
                            value={formData.loginPassword || ''} 
                            className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] flex-1" 
                            readOnly
                          />
                          <Button
                            className="bg-[#0F1B3D] hover:bg-[#1E2C57] text-white font-bold"
                            onClick={() => {
                              const newPassword = Math.random().toString(36).substring(2, 10)
                              setFormData({ ...formData, loginPassword: newPassword })
                            }}
                          >
                            Generate
                          </Button>
                          {formData.loginPassword && (
                            <Button
                              className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold"
                              onClick={() => {
                                navigator.clipboard.writeText(formData.loginPassword)
                                // Show copied confirmation
                                setFormData({ ...formData, copiedPassword: true })
                                setTimeout(() => {
                                  setFormData((prev: any) => ({ ...prev, copiedPassword: false }))
                                }, 2000)
                              }}
                            >
                              {formData.copiedPassword ? 'Copied!' : 'Copy'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button
                        className="bg-white hover:bg-white w-full text-white font-bold"
                        onClick={async () => {
                          if (!formData.loginEmail || !formData.loginPassword) {
                            alert('Please enter email and generate password')
                            return
                          }
                          try {
                            const response = await fetch('/api/admin/create-client-login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: formData.loginEmail,
                                account_no: editingCustomer.account_no,
                                password: formData.loginPassword
                              })
                            })
                            const result = await response.json()
                            if (!response.ok) {
                              throw new Error(result.error || 'Failed to create login')
                            }
                            
                            // Update local customers state
                            setPagedCustomers((prevCustomers: any[]) =>
                              prevCustomers.map((customer) =>
                                customer.account_no === editingCustomer.account_no
                                  ? {
                                      ...customer,
                                      user_id: result.userId,
                                      email: formData.loginEmail,
                                    }
                                  : customer
                              )
                            )
                            
                            alert('Login created successfully!')
                            setEditingCustomer(null)
                            setFormData({})
                            mutate()
                          } catch (err: any) {
                            console.error('[v0] Create login error:', err)
                            alert('Error creating login: ' + err.message)
                          }
                        }}
                      >
                        Create Login
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#E7F4EE] border border-[#E3E6EC] rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-[#0B6B41]" />
                          <p className="text-[#0B6B41] text-sm font-bold">Login Active</p>
                        </div>
                        <p className="text-[#0B6B41] text-xs">This customer has an active login account.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3D4452] mb-2">Email</label>
                        <Input 
                          value={editingCustomer.email || ''} 
                          className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]" 
                          readOnly 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3D4452] mb-2">Status</label>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            editingCustomer.user_status === 'approved' 
                              ? 'bg-[#E7F4EE] border-[#E3E6EC] text-[#0B6B41]'
                              : 'bg-[#FFF4DB] border-[#E3E6EC] text-[#7A4F00]'
                          }`}>
                            {editingCustomer.user_status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-[#E3E6EC] pt-4 space-y-3">
                        <Button
                          className="bg-[#0F1B3D] hover:bg-[#1E2C57] w-full text-white font-bold gap-2"
                          onClick={handleResetClientPassword}
                          disabled={loginActionLoading === 'reset'}
                        >
                          {loginActionLoading === 'reset' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Resetting...
                            </>
                          ) : 'Reset Password'}
                        </Button>
                        <Button
                          className="bg-[#C8102E] hover:bg-[#A50D26] w-full text-white font-bold gap-2"
                          onClick={handleRevokeClientAccess}
                          disabled={loginActionLoading === 'revoke'}
                        >
                          {loginActionLoading === 'revoke' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Revoking...
                            </>
                          ) : 'Revoke Access'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-8 py-4 rounded-b-xl flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => setEditingCustomer(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold transition-all"
                onClick={async () => {
                  try {
                    const clientUpdates = {
                      client_name: formData.client_name ?? editingCustomer.client_name,
                      address: formData.address ?? editingCustomer.address,
                    }

                    try {
                      await adminWrite({ table: 'clients', action: 'update', key: editingCustomer.account_no, values: clientUpdates })
                    } catch (clientError) {
                      console.error('[v0] Error updating clients:', clientError)
                      alert(clientError instanceof Error ? clientError.message : 'Error updating client details')
                      return
                    }

                    const contactUpdates = {
                      client_account_no: editingCustomer.account_no,
                      full_name: formData.full_name ?? editingCustomer.full_name ?? null,
                      email: formData.email ?? editingCustomer.email ?? null,
                      phone_number: formData.phone_number ?? editingCustomer.phone_number ?? null,
                      business_type: formData.business_type ?? editingCustomer.business_type ?? null,
                    }

                    const contactResponse = await fetch('/api/admin/contacts', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contactUpdates),
                    })

                    if (!contactResponse.ok) {
                      console.error('[v0] Error updating contacts:', await contactResponse.text())
                      alert('Error updating contact details')
                      return
                    }

                    // Update users table if edits exist
                    const hasUserUpdates =
                      editingCustomer.user_id &&
                      (
                        formData.full_name !== undefined ||
                        formData.phone_number !== undefined ||
                        formData.business_type !== undefined ||
                        formData.email !== undefined ||
                        formData.status !== undefined
                      )

                    if (hasUserUpdates) {
                      const userUpdateResponse = await fetch('/api/admin/users', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: editingCustomer.user_id,
                          updates: {
                            full_name: formData.full_name ?? editingCustomer.full_name,
                            phone_number: formData.phone_number ?? editingCustomer.phone_number,
                            business_type: formData.business_type ?? editingCustomer.business_type,
                            email: formData.email ?? editingCustomer.email,
                            status: formData.status ?? editingCustomer.status,
                          },
                        }),
                      })

                      if (!userUpdateResponse.ok) {
                        console.error('[v0] Error updating users:', await userUpdateResponse.text())
                        alert('Error updating contact details')
                        return
                      }
                    }

                    // Handle password reset
                    if (editingCustomer.user_id && formData.resetPassword) {
                      try {
                        const response = await fetch('/api/admin/reset-client-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            account_no: editingCustomer.account_no,
                            newPassword: formData.resetPassword
                          })
                        })
                        const result = await response.json()
                        if (!response.ok) {
                          throw new Error(result.error || 'Failed to reset password')
                        }
                        console.log('[v0] Password reset successfully')
                      } catch (err: any) {
                        console.error('[v0] Password reset error:', err)
                        alert('Error resetting password: ' + err.message)
                        return
                      }
                    }

                    // Handle revoke access
                    if (editingCustomer.user_id && formData.revokeAccess) {
                      const revokeResponse = await fetch('/api/admin/users', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: editingCustomer.user_id, updates: { status: 'rejected' } }),
                      })

                      if (!revokeResponse.ok) {
                        console.error('[v0] Error revoking access:', await revokeResponse.text())
                        alert('Error revoking access')
                        return
                      }
                    }

                    console.log('[v0] All updates saved successfully')
                    mutate()
                    setEditingCustomer(null)
                    setFormData({})
                  } catch (err) {
                    console.error('[v0] Error in Save Changes:', err)
                    alert('An error occurred while saving')
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Credentials Modal */}
      {createdLoginCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-white text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Login Created Successfully
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => setCreatedLoginCredentials(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#3D4452] mb-6">Share these credentials with the client:</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#5A6272] mb-1">Email</label>
                  <div className="bg-[#F8F9FB] border border-[#E3E6EC] rounded px-3 py-2 text-[#121826] font-mono text-sm break-all">
                    {createdLoginCredentials.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5A6272] mb-1">Temporary Password</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#F8F9FB] border border-[#E3E6EC] rounded px-3 py-2 text-[#121826] font-mono text-sm">
                      {'•'.repeat(createdLoginCredentials.password.length)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                      onClick={handleCopyPassword}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFF4DB] border border-[#E3E6EC] rounded p-3 text-xs text-[#7A4F00]">
                The client must change their password on first login.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-6 py-4 flex justify-end gap-3">
              <Button
                className="bg-white hover:bg-white text-white font-bold transition-all"
                onClick={() => setCreatedLoginCredentials(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Login Customer Picker */}
      {showCreateLoginModal && !selectedCustomerForLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-white text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Create Client Login</h2>
                <p className="text-sm text-[#0F1B3D] mt-1">Choose the customer who needs access</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => setShowCreateLoginModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                placeholder="Search customers by name, account, or email..."
                value={createLoginSearch}
                onChange={(e) => setCreateLoginSearch(e.target.value)}
                className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
              />

              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                {clients
                  .filter((customer: any) => {
                    const q = createLoginSearch.toLowerCase()
                    return !q ||
                      customer.client_name?.toLowerCase().includes(q) ||
                      customer.full_name?.toLowerCase().includes(q) ||
                      customer.account_no?.toLowerCase().includes(q) ||
                      customer.email?.toLowerCase().includes(q)
                  })
                  .slice(0, 30)
                  .map((customer: any) => (
                    <button
                      key={customer.account_no}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerForLogin(customer)
                        setCreateLoginEmail('')
                        setShowCreateLoginModal(false)
                        setCreateLoginError('')
                        setCreateLoginSuccess('')
                      }}
                      className="w-full text-left rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] px-4 py-3 transition-all hover:border-[#E3E6EC] hover:bg-[#F4F5F7]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#121826]">{customer.client_name || customer.full_name || 'Unnamed customer'}</p>
                          <p className="text-xs text-[#5A6272]">{customer.account_no}</p>
                          <p className="text-xs text-[#3D4452] mt-1 break-all">{customer.email || 'No email on file'}</p>
                        </div>
                        <Plus className="w-4 h-4 text-[#0F1B3D]" />
                      </div>
                    </button>
                  ))}

                {clients.filter((customer: any) => {
                  const q = createLoginSearch.toLowerCase()
                  return !q ||
                    customer.client_name?.toLowerCase().includes(q) ||
                    customer.full_name?.toLowerCase().includes(q) ||
                    customer.account_no?.toLowerCase().includes(q) ||
                    customer.email?.toLowerCase().includes(q)
                }).length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#E3E6EC] px-4 py-8 text-center text-[#5A6272]">
                    No customers match your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Login Modal */}
      {selectedCustomerForLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-white text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Client Login</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => setSelectedCustomerForLogin(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-[#3D4452] mb-4">Create a login for <span className="font-bold text-[#121826]">{selectedCustomerForLogin.client_name}</span></p>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Email Address</label>
                <Input
                  type="email"
                  value={createLoginEmail}
                  onChange={(e) => setCreateLoginEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                />
              </div>

              {createLoginError && (
                <div className="p-3 rounded-lg bg-[#FDECEA] border border-[#E8A5A5] text-[#A4161A] text-sm">
                  {createLoginError}
                </div>
              )}

              {createLoginSuccess && (
                <div className="p-3 rounded-lg bg-[#E7F4EE] border border-[#E3E6EC] text-[#0B6B41] text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {createLoginSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => setSelectedCustomerForLogin(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#0F1B3D] hover:bg-[#1E2C57] text-white font-bold transition-all"
                disabled={creatingLogin === selectedCustomerForLogin.account_no}
                onClick={() => handleCreateClientLogin()}
              >
                {creatingLogin === selectedCustomerForLogin.account_no ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Login'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-white sticky top-0 text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add New Product</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => {
                  setShowAddProductModal(false)
                  setProductFormData({})
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Product Name</label>
                <Input
                  value={productFormData.title || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">SKU</label>
                  <Input
                    value={productFormData.sku || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">Price</label>
                  <Input
                    type="number"
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">Stock Quantity</label>
                  <Input
                    type="number"
                    value={productFormData.inventory_quantity || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, inventory_quantity: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">Product Type</label>
                  <Input
                    value={productFormData.product_type || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Description</label>
                <Textarea
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                  rows={3}
                />
              </div>

              <div className="border-t border-[#E3E6EC] pt-4">
                <label className="block text-sm font-bold text-[#3D4452] mb-3">Product Image</label>
                <div className="flex items-center gap-4">
                  <label className="bg-[#C8102E] hover:bg-[#A50D26] flex items-center gap-2 px-4 py-2 text-white rounded-lg font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload className="w-4 h-4" />
                    Upload Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleImageUpload(productFormData.sku, e.target.files)
                        }
                      }}
                      disabled={uploadingImage !== null || !productFormData.sku}
                      className="hidden"
                    />
                  </label>
                  {uploadingImage !== null && <span className="text-sm text-[#3D4452]">Uploading...</span>}
                  {imageUploadError && <span className="text-sm text-[#A4161A] font-medium">{imageUploadError}</span>}
                </div>
                {previewImage && (
                  <div className="mt-3">
                    <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-[#E3E6EC]" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => {
                  setShowAddProductModal(false)
                  setProductFormData({})
                  setPreviewImage(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold transition-all"
                disabled={savingProduct}
                onClick={() => handleSaveProduct()}
              >
                {savingProduct ? 'Adding...' : 'Add Product'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-white sticky top-0 text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Product</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => setEditingProduct(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Product Name</label>
                <Input
                  value={productFormData.title || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">SKU</label>
                  <Input
                    disabled
                    value={productFormData.sku || ''}
                    className="border-[#E3E6EC] bg-[#F8F9FB] text-[#5A6272] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">Price</label>
                  <Input
                    type="number"
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">Stock Quantity</label>
                  <Input
                    type="number"
                    value={productFormData.inventory_quantity || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, inventory_quantity: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3D4452] mb-2">Product Type</label>
                  <Input
                    value={productFormData.product_type || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value })}
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Description</label>
                <Textarea
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826] placeholder:text-[#8A919E]"
                  rows={3}
                />
              </div>

              <div className="border-t border-[#E3E6EC] pt-4">
                <label className="block text-sm font-bold text-[#3D4452] mb-3">Product Image</label>
                <div className="flex items-center gap-4">
                    <label className="bg-[#C8102E] hover:bg-[#A50D26] flex items-center gap-2 px-4 py-2 text-white rounded-lg font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      <Upload className="w-4 h-4" />
                      Upload Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            handleImageUpload(productFormData.sku, e.target.files)
                          }
                        }}
                        disabled={uploadingImage !== null}
                        className="hidden"
                      />
                    </label>
                    {uploadingImage !== null && <span className="text-sm text-[#3D4452]">Uploading...</span>}
                    {imageUploadError && <span className="text-sm text-[#A4161A] font-medium">{imageUploadError}</span>}
                  </div>
                  {productGallery.length > 0 && (
                    <div className="mt-3">
                      <div className="grid grid-cols-4 gap-3">
                        {productGallery.map((imageUrl, index) => (
                          <div
                            key={`${imageUrl}-${index}`}
                            className={`relative rounded-lg border overflow-hidden transition-all ${
                              previewImage === imageUrl ? 'border-red-500 ring-2 ring-red-500/40' : 'border-[#E3E6EC] hover:border-[#E8A5A5]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewImage(imageUrl)}
                              className="block w-full"
                            >
                              <img src={imageUrl} alt={`Product preview ${index + 1}`} className="w-full h-20 object-cover" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete image ${index + 1}`}
                              onClick={() => handleDeleteProductImage(productFormData.sku, imageUrl)}
                              disabled={deletingProductImage === imageUrl}
                              className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full border border-[#E3E6EC] bg-white text-[#A4161A] p-1.5 transition-colors disabled:opacity-60"
                            >
                              {deletingProductImage === imageUrl ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-6 py-4 flex justify-between gap-3">
              <Button
                variant="outline"
                className="border-red-500 text-[#A4161A] hover:bg-[#F4F5F7] font-bold bg-transparent"
                disabled={deletingProduct === editingProduct?.sku}
                onClick={() => handleDeleteProduct(editingProduct.sku)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingProduct === editingProduct?.sku ? 'Deleting...' : 'Delete Product'}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                  onClick={() => {
                    setEditingProduct(null)
                    setPreviewImage(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold transition-all"
                  disabled={savingProduct}
                  onClick={() => handleSaveProduct()}
                >
                  {savingProduct ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-white sticky top-0 text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Order {viewingOrder.order_number}</h2>
                <p className="text-xs opacity-80 mt-1">Order Details</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => setViewingOrder(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#5A6272] font-bold mb-1">Customer</p>
                  <p className="text-[#121826] font-bold">{viewingOrder.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5A6272] font-bold mb-1">Order Date</p>
                  <p className="text-[#121826] font-bold">{formatDate(viewingOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5A6272] font-bold mb-1">Items</p>
                  <p className="text-[#121826] font-bold">{viewingOrder.item_count}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5A6272] font-bold mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingOrder.payment_status)}`}>
                    {viewingOrder.payment_status}
                  </span>
                </div>
              </div>

              {/* Send Payment Link */}
              <div className="border-t border-[#E3E6EC] pt-4">
                <p className="text-sm text-[#5A6272] font-bold mb-3">Send Payment Link</p>
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#E3E6EC] bg-[#F8F9FB] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold">To</p>
                        <p className="text-sm text-[#121826] font-medium break-all">{viewingOrderEmail || 'No contact email available'}</p>
                        {viewingOrderContactName && (
                          <p className="text-xs text-[#5A6272] mt-1">Contact: {viewingOrderContactName}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold">From</p>
                      <p className="text-sm text-[#121826] font-medium break-all">kbc@notification.leadsync.co.za</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#5A6272] font-bold mb-1">Link</p>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 rounded-md border border-[#E3E6EC] bg-[#F8F9FB] px-3 py-2 text-sm text-[#121826] break-all">
                          {paymentLinkPreview || 'Will be generated when you click Send via Email'}
                        </div>
                        {paymentLinkPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                            onClick={() => navigator.clipboard.writeText(paymentLinkPreview)}
                          >
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent gap-2"
                        disabled={sendingPaymentLink}
                        onClick={async () => {
                          try {
                            setSendingPaymentLink(true)
                            const paymentResponse = await fetch('/api/payfast/create-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                  id: 2,
                                  client_id: viewingOrder.client_account_no,
                                  amount: viewingOrder.total_amount,
                                  item_name: `Order ${viewingOrder.order_number}`,
                                  order_number: viewingOrder.order_number,
                                  item_description: `KBC Order - ${viewingOrder.item_count || viewingOrder.order_items?.length || 0} items`,
                                  name_first: viewingOrderContactName || viewingOrder.client_name || 'Customer',
                                  name_last: '',
                                  email_address: viewingOrderEmail,
                                  cell_number: '',
                                  custom_int1: '1',
                                  custom_str1: String(viewingOrder.id),
                                  source: 'admin',
                                }),
                            })

                            const paymentData = await paymentResponse.json()
                            if (!paymentResponse.ok) {
                              throw new Error(paymentData.error || paymentData.details || paymentData.message || 'Failed to create payment link')
                            }

                            const paymentUrl = paymentData.url || paymentData.shortened_url
                            if (!paymentUrl) {
                              throw new Error('No payment URL returned from payment API')
                            }

                            setPaymentLinkPreview(paymentUrl)

                            const response = await fetch('/api/admin/send-payment-link', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                order_number: viewingOrder.order_number,
                                order_id: viewingOrder.id,
                                customer_email: viewingOrderEmail,
                                customer_name: viewingOrder.client_name,
                                amount: viewingOrder.total_amount,
                                item_name: `Order ${viewingOrder.order_number}`,
                                item_description: `KBC Order - ${viewingOrder.item_count || viewingOrder.order_items?.length || 0} items`,
                                payment_url: paymentUrl,
                              }),
                            })

                            const result = await response.json()
                            if (!response.ok) {
                              const detailText = result.details
                                ? `: ${typeof result.details === 'string' ? result.details : JSON.stringify(result.details)}`
                                : ''
                              throw new Error(`${result.error || result.message || 'Failed to send payment link'}${detailText}`)
                            }

                            setPaymentLinkPreview(result.paymentUrl || paymentUrl)
                            alert('Payment link sent successfully via email')
                          } catch (error: any) {
                            console.error('[v0] Sending payment link via email failed:', error)
                            alert(error?.message || 'Failed to send payment link')
                          } finally {
                            setSendingPaymentLink(false)
                          }
                        }}
                      >
                        <Mail className="w-4 h-4" />
                        {sendingPaymentLink ? 'Sending...' : 'Send via Email'}
                      </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent gap-2"
                      onClick={() => {
                        console.log('[v0] Sending payment link via SMS to:', viewingOrder.client_name)
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send via SMS
                    </Button>
                  </div>
                </div>
              </div>

              {/* Order Amount */}
              <div className="border-t border-[#E3E6EC] pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[#3D4452] font-bold">Total Amount</p>
                  <p className="text-2xl font-bold text-[#A4161A]">R{Number(viewingOrder.total_amount).toLocaleString()}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="border-t border-[#E3E6EC] pt-4 space-y-3">
                <div>
                  <p className="text-sm text-[#5A6272] font-bold mb-1">Order Number</p>
                  <p className="text-[#121826] font-mono">{viewingOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5A6272] font-bold mb-1">Payment Status</p>
                  <p className="text-[#121826] capitalize">{viewingOrder.payment_status}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => setViewingOrder(null)}
              >
                Close
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold transition-all"
                onClick={() => {
                  console.log('[v0] Processing order:', viewingOrder.order_number)
                  setViewingOrder(null)
                }}
              >
                Process Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg max-w-md w-full">
            <div className="bg-white text-[#121826] border-b border-[#E3E6EC] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Admin
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#121826] hover:bg-[#F4F5F7]"
                onClick={() => {
                  setShowAddAdminModal(false)
                  setAddAdminFormData({ email: '', full_name: '', password: '' })
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Full Name</label>
                <Input
                  value={addAdminFormData.full_name}
                  onChange={(e) => setAddAdminFormData({ ...addAdminFormData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Email</label>
                <Input
                  type="email"
                  value={addAdminFormData.email}
                  onChange={(e) => setAddAdminFormData({ ...addAdminFormData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Password</label>
                <Input
                  type="password"
                  value={addAdminFormData.password}
                  onChange={(e) => setAddAdminFormData({ ...addAdminFormData, password: e.target.value })}
                  placeholder="Enter password"
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
            </div>
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => {
                  setShowAddAdminModal(false)
                  setAddAdminFormData({ email: '', full_name: '', password: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold"
                disabled={addAdminLoading || !addAdminFormData.email || !addAdminFormData.full_name || !addAdminFormData.password}
                onClick={async () => {
                  setAddAdminLoading(true)
                  try {
                    const response = await fetch('/api/admin/create-admin-user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(addAdminFormData)
                    })
                    const result = await response.json()
                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to create admin')
                    }
                    alert('Admin user created successfully!')
                    setShowAddAdminModal(false)
                    setAddAdminFormData({ email: '', full_name: '', password: '' })
                    const refreshResponse = await fetch('/api/admin/users?role=admin')
                    const { users } = refreshResponse.ok ? await refreshResponse.json() : { users: [] }
                    setTeamUsers(users || [])
                  } catch (err: any) {
                    alert('Error creating admin: ' + err.message)
                  } finally {
                    setAddAdminLoading(false)
                  }
                }}
              >
                {addAdminLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Admin'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-[#0F1B3D]/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg w-full max-w-md">
            <div className="bg-white text-[#121826] px-8 py-6 border-b border-[#E3E6EC] flex items-center justify-between rounded-t-lg">
              <h2 className="text-2xl font-bold">Change Password</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#F4F5F7] text-[#121826]"
                onClick={() => setShowChangePasswordModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
            </div>
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-8 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => setShowChangePasswordModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold"
                disabled={settingsLoading || !passwordFormData.newPassword || !passwordFormData.confirmPassword}
                onClick={handleChangePassword}
              >
                {settingsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings Modal */}
      {showEmailSettingsModal && (
        <div className="fixed inset-0 bg-[#0F1B3D]/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E6EC] rounded-lg w-full max-w-md">
            <div className="bg-white text-[#121826] px-8 py-6 border-b border-[#E3E6EC] flex items-center justify-between rounded-t-lg">
              <h2 className="text-2xl font-bold">Email Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#F4F5F7] text-[#121826]"
                onClick={() => setShowEmailSettingsModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Company Name</label>
                <Input
                  placeholder="e.g., KBC Trading"
                  value={emailSettings.companyName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, companyName: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Sender Email</label>
                <Input
                  type="email"
                  placeholder="noreply@kbc.co.za"
                  value={emailSettings.senderEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3D4452] mb-2">Sender Name</label>
                <Input
                  placeholder="KBC Support"
                  value={emailSettings.senderName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white text-[#121826]"
                />
              </div>
            </div>
            <div className="border-t border-[#E3E6EC] bg-[#F8F9FB] px-8 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                className="border-[#E3E6EC] text-[#3D4452] hover:text-[#121826] hover:bg-[#F4F5F7] font-bold bg-transparent"
                onClick={() => setShowEmailSettingsModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#C8102E] hover:bg-[#A50D26] text-white font-bold"
                disabled={settingsLoading || !emailSettings.companyName || !emailSettings.senderEmail}
                onClick={handleSaveEmailSettings}
              >
                {settingsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
