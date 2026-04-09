'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LogOut, Package, Users, ShoppingCart, BarChart3, Menu, X, Edit2, Trash2, Plus, CheckCircle2, AlertCircle, Clock, Loader2, Send, Mail, MessageSquare, Check, XCircle, Upload, ImageIcon, TrendingUp, ChevronDown, Lock, Shield, Bell, Database, Globe, Palette, CreditCard, Building2, Settings, User, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const fetcher = (url: string) => fetch(url).then(res => res.json())

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
  switch (status) {
    case 'Active':
      return 'bg-gradient-to-r from-green-500/20 to-green-400/20 border-green-500/50 text-green-700 dark:text-green-300'
    case 'Pending':
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300'
    case 'Completed':
      return 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 border-blue-500/50 text-blue-700 dark:text-blue-300'
    case 'Shipped':
      return 'bg-gradient-to-r from-purple-500/20 to-purple-400/20 border-purple-500/50 text-purple-700 dark:text-purple-300'
    case 'Low Stock':
      return 'bg-gradient-to-r from-orange-500/20 to-orange-400/20 border-orange-500/50 text-orange-700 dark:text-orange-300'
    default:
      return 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/50'
  }
}

export default function AdminPage() {
  const { data: adminData, error: adminError, isLoading, mutate } = useSWR('/api/admin', fetcher)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showCreateLoginModal, setShowCreateLoginModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productFormData, setProductFormData] = useState<any>({})
  const [createLoginEmail, setCreateLoginEmail] = useState('')
  
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
  const PRODUCTS_PER_PAGE = 15

  const [customerPage, setCustomerPage] = useState(1)
  const [pagedCustomers, setPagedCustomers] = useState<any[]>([])
  const [totalCustomerCount, setTotalCustomerCount] = useState(0)
  const [customerPageLoading, setCustomerPageLoading] = useState(false)
  const CUSTOMERS_PER_PAGE = 15
  const ORDERS_PER_PAGE = 15
  const [orderPage, setOrderPage] = useState(1)

  const products = adminData?.products || []
  const clients = adminData?.clients || []
  const orders = adminData?.orders || []
  const stats = adminData?.stats || { totalProducts: 0, activeCustomers: 0, totalOrders: 0, totalRevenue: 0 }
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
    { label: 'Total Products', value: String(stats.totalProducts), icon: Package, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Customers', value: String(stats.activeCustomers), icon: Users, color: 'from-green-500 to-green-600' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingCart, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Revenue', value: `R${Number(stats.totalRevenue).toLocaleString()}`, icon: TrendingUp, color: 'from-pink-500 to-pink-600' },
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

      const { error: insertError } = await supabase
        .from('product_images')
        .insert(uploads)

      if (insertError) {
        console.error('[v0] Insert error:', insertError)
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

  const saveEditProduct = async () => {
    if (!editingProductSku) return
    setEditProductLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({
          title: editProductData.title,
          product_type: editProductData.product_type,
          description: editProductData.description,
          price: parseFloat(editProductData.price) || 0,
          inventory_quantity: parseInt(editProductData.inventory_quantity) || 0,
        })
        .eq('sku', editingProductSku)
      if (error) throw error
      // Update local state
      setPagedProducts(prev => prev.map(p => 
        p.sku === editingProductSku 
          ? {...p, ...editProductData, price: parseFloat(editProductData.price) || 0, inventory_quantity: parseInt(editProductData.inventory_quantity) || 0}
          : p
      ))
      setEditingProductSku(null)
    } catch (err) {
      console.error('[v0] Error saving product:', err)
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

      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_sku', sku)
        .eq('storage_path', imageUrl)
      
      if (deleteError) throw deleteError

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
      const supabase = createClient()
      await supabase.from('products').delete().eq('sku', sku)
      mutate()
    } catch (err) {
      console.error('[v0] Error deleting product:', err)
    } finally {
      setDeletingProduct(null)
    }
  }

  const handleSaveProduct = async () => {
    setSavingProduct(true)
    try {
      const supabase = createClient()
      if (editingProduct) {
        await supabase.from('products').update(productFormData).eq('sku', editingProduct.sku)
      } else {
        await supabase.from('products').insert([productFormData])
      }
      mutate()
      setEditingProduct(null)
      setShowAddProductModal(false)
      setProductFormData({})
    } catch (err) {
      console.error('[v0] Error saving product:', err)
    } finally {
      setSavingProduct(false)
    }
  }

  const handleApproveCustomer = async (customer: any) => {
    setApprovingCustomer(customer.account_no)
    try {
      const supabase = createClient()
      await supabase.from('users').update({ status: 'approved' }).eq('id', customer.user_id)
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
      const supabase = createClient()
      await supabase.from('users').update({ status: 'rejected' }).eq('id', customer.user_id)
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
      const supabase = createClient()
      await supabase.from('orders').update({ payment_status: newStatus }).eq('order_number', orderNumber)
      setStatusUpdateSuccess(orderNumber)
      setTimeout(() => setStatusUpdateSuccess(null), 2000)
      mutate()
    } catch (err) {
      console.error('[v0] Error updating order status:', err)
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
        const supabase = createClient()
        const skus = pagedProducts.map((p: any) => p.sku)
        const { data, error } = await supabase
          .from('product_images')
          .select('product_sku, storage_path')
          .in('product_sku', skus)
          .eq('is_primary', true)
        if (error) {
          console.error('[v0] Error fetching product images:', error)
          return
        }
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
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, status, business_id')

        if (error) {
          console.error('[v0] Error fetching team users:', error)
          return
        }

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
        const supabase = createClient()
        const { data, error } = await supabase
          .from('product_images')
          .select('*')
          .eq('is_primary', true)

        if (error) {
          console.error('[v0] Error fetching product images:', error)
          return
        }

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
        const supabase = createClient()
        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('role', 'admin')
        
        if (error) {
          console.error('[v0] Error fetching team users:', error)
          return
        }
        setTeamUsers(users || [])
      } catch (err) {
        console.error('[v0] Error in fetchTeamUsers:', err)
      }
    }
    fetchTeamUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-400 animate-spin" />
        <p className="mt-4 text-slate-400 font-bold">Loading admin panel...</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:96px_96px] opacity-20" />
      {/* Admin Header */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-blue-500/30 bg-[#06123dcc]/90 text-white shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/kbc-logo.png" alt="KBC" className="h-14 w-auto" />
            <div className="hidden md:block">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-300/80">KBC CRM</p>
              <p className="text-sm font-semibold text-slate-100">Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Admin workspace</span>
            </div>
            <Button
              size="icon"
              className="bg-red-600 hover:bg-red-700 text-white transition-all"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-white/10 transition-all text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 pt-[72px]">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-[#06123d]/80 border-r border-white/10 fixed md:fixed md:top-[72px] md:left-0 md:h-[calc(100vh-72px)] transition-transform z-30 backdrop-blur-xl shadow-[12px_0_40px_rgba(0,0,0,0.18)] ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-6 border-b border-white/10">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-2">Workspace</p>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-red-500/10 p-4 shadow-inner">
              <p className="text-sm font-semibold text-white">Customer CRM</p>
              <p className="text-xs text-slate-300 mt-1">Manage products, customers, orders, and payments from one panel.</p>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.35em] text-slate-500">Navigation</p>
            {[
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'payment', label: 'Payment', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: AlertCircle },
            ].map((item) => {
              const Icon = item.icon
              return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center gap-3 border ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 border-blue-400/30'
                    : 'border-transparent hover:border-white/10 hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === item.id ? 'bg-white/15' : 'bg-white/5'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {activeTab === item.id && <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />}
              </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="relative flex-1 overflow-auto md:ml-64">
          <div className="mx-auto w-full max-w-[1700px] px-4 py-8 lg:px-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-r from-[#07163f]/95 via-[#0b2a5b]/95 to-[#102f73]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400 mb-3">Operations snapshot</p>
                      <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                        Dashboard
                        <span className="block bg-gradient-to-r from-red-400 via-white to-blue-200 bg-clip-text text-transparent">
                          KBC CRM Control Center
                        </span>
                      </h1>
                      <p className="mt-4 max-w-2xl text-slate-300">
                        Track products, customers, orders, and payments from a single workspace built for day-to-day operations.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30">
                        <Link href="#orders">Review Orders</Link>
                      </Button>
                      <Button asChild variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">
                        <Link href="#customers">Customer CRM</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statsCards.map((stat) => {
                      const Icon = stat.icon
                      return (
                        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{stat.label}</p>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                              <Icon className="w-5 h-5" />
                            </div>
                          </div>
                          <p className="mt-4 text-3xl font-black text-white">{stat.value}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsCards.map((stat, idx) => {
                    const Icon = stat.icon
                    return (
                      <div
                        key={stat.label}
                        className="group cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c2e67]/80 to-[#07163f]/80 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:shadow-[0_18px_50px_rgba(220,38,38,0.18)] animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{stat.label}</p>
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                          </div>
                        </div>
                        <p className="text-4xl font-black text-white">{stat.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Recent Orders & Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b2a5b]/90 to-[#07163f]/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-2">Activity</p>
                        <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                      </div>
                      <Button asChild variant="outline" size="sm" className="border-red-500/50 text-red-300 hover:bg-red-500/10 font-bold bg-transparent">
                        <Link href="#orders">View All</Link>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order: any, idx: number) => (
                        <div key={order.order_number} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-red-500/30 hover:bg-white/[0.07] animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-white">{order.order_number}</p>
                              <p className="text-xs text-slate-400">{order.client_name}</p>
                            </div>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-slate-400">{order.item_count} items</p>
                            <p className="font-bold text-red-300">R{Number(order.total_amount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Customers */}
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b2a5b]/90 to-[#07163f]/90 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400 mb-2">Relationship view</p>
                        <h2 className="text-xl font-bold text-white">Top Customers</h2>
                      </div>
                      <Button asChild variant="outline" size="sm" className="border-red-500/50 text-red-300 hover:bg-red-500/10 font-bold bg-transparent">
                        <Link href="#customers">View All</Link>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {clients.filter((c: any) => c.order_count > 0).slice(0, 3).map((customer: any, idx: number) => (
                        <div key={customer.account_no} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-red-500/30 hover:bg-white/[0.07] animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-white">{customer.client_name}</p>
                              <p className="text-xs text-slate-400">{customer.account_no}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-300">{customer.order_count} orders</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">Products</h1>
                    <p className="text-muted-foreground">Manage your product catalog</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => { setProductSearch(e.target.value); setProductPage(1) }}
                      className="w-64 bg-slate-800/50 border-slate-600/50"
                    />
                    <Button 
                      onClick={() => setShowAddProductModal(true)}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Image</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">SKU</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedProducts.map((product: any) => (
                          <tr key={product.sku} className="hover:bg-slate-400/10 transition-colors">
                            <td className="py-3 px-4">
                              {productImages[product.sku]?.[0] ? (
                                <img src={productImages[product.sku][0]} alt="" className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-sm text-foreground">{product.sku}</td>
                            <td className="py-3 px-4 text-foreground">{product.description}</td>
                            <td className="py-3 px-4 text-foreground">R{product.price?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-foreground">{product.stock || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setEditingProduct(product)}
                                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteProduct(product.sku)}
                                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        Showing {((productPage - 1) * PRODUCTS_PER_PAGE) + 1} to {Math.min(productPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductPage(p => Math.max(1, p - 1))}
                          disabled={productPage === 1}
                          className="border-slate-600/50"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {productPage} of {totalProductPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}
                          disabled={productPage === totalProductPages}
                          className="border-slate-600/50"
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
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">Customers</h1>
                    <p className="text-muted-foreground">Manage customer accounts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setCustomerPage(1) }}
                      className="w-64 bg-slate-800/50 border-slate-600/50"
                    />
                    <Button 
                      onClick={() => setShowCreateLoginModal(true)}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Login
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Account #</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedCustomers.map((client: any) => (
                          <tr key={client.account_no} className="hover:bg-slate-400/10 transition-colors">
                            <td className="py-3 px-4 font-mono text-sm text-foreground">{client.account_no}</td>
                            <td className="py-3 px-4 text-foreground">{client.client_name || client.full_name || '-'}</td>
                            <td className="py-3 px-4 text-foreground">{client.email || '-'}</td>
                            <td className="py-3 px-4 text-foreground">{client.phone_number || '-'}</td>
                            <td className="py-3 px-4">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingCustomer(client)}
                                className="text-primary hover:text-primary/80 hover:bg-primary/10"
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        Showing {((customerPage - 1) * CUSTOMERS_PER_PAGE) + 1} to {Math.min(customerPage * CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                          disabled={customerPage === 1}
                          className="border-slate-600/50"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {customerPage} of {totalCustomerPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                          disabled={customerPage === totalCustomerPages}
                          className="border-slate-600/50"
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
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">Orders</h1>
                    <p className="text-muted-foreground">Manage customer orders</p>
                  </div>
                  <Input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1) }}
                    className="w-64 bg-slate-800/50 border-slate-600/50"
                  />
                </div>

                <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-12"></th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Order #</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedOrders.map((order: any) => (
                          <React.Fragment key={order.order_number}>
                            <tr className="hover:bg-slate-400/10 transition-colors">
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
                                  className="p-1 hover:bg-primary/20 rounded transition-all"
                                >
                                  <ChevronDown className={`w-5 h-5 text-foreground transition-transform ${expandedOrders.has(order.order_number) ? 'rotate-180' : ''}`} />
                                </button>
                              </td>
                              <td className="py-4 font-bold text-secondary">{order.order_number}</td>
                              <td className="py-4 text-foreground">
                                <div className="text-sm">
                                  <p className="font-bold">{order.client_name}</p>
                                  <p className="text-xs text-muted-foreground">{order.client_account_no}</p>
                                </div>
                              </td>
                              <td className="py-4 text-foreground">{order.client_name}</td>
                              <td className="py-4 text-muted-foreground text-xs">{formatDate(order.order_date)}</td>
                              <td className="py-4 text-muted-foreground">{order.order_items?.length || 0}</td>
                              <td className="py-4 font-bold text-foreground">R{Number(order.total_amount).toLocaleString()}</td>
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
                                    <option value="Shipped">Shipped</option>
                                  </select>
                                  {statusUpdateSuccess === order.order_number && (
                                    <Check className="w-4 h-4 text-green-400" />
                                  )}
                                </div>
                              </td>
                              <td className="py-4">
                                <Button size="sm" variant="ghost" className="text-secondary hover:text-secondary/70 font-bold" onClick={() => setViewingOrder(order)}>
                                  View
                                </Button>
                              </td>
                            </tr>
                            {expandedOrders.has(order.order_number) && (
                              <tr>
                                <td colSpan={9} className="p-0">
                                  <div className="bg-primary/5 border-t border-primary/10 p-6">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-primary/20">
                                          <th className="text-left py-3 px-4 font-bold text-foreground">Product Name</th>
                                          <th className="text-left py-3 px-4 font-bold text-foreground">SKU</th>
                                          <th className="text-left py-3 px-4 font-bold text-foreground">Quantity</th>
                                          <th className="text-left py-3 px-4 font-bold text-foreground">Unit Price</th>
                                          <th className="text-left py-3 px-4 font-bold text-foreground">Tax</th>
                                          <th className="text-left py-3 px-4 font-bold text-foreground">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-primary/10">
                                        {order.order_items?.map((item: any, idx: number) => (
                                          <tr key={idx} className="hover:bg-primary/5">
                                            <td className="py-3 px-4 text-foreground">{item.products?.title || 'Unknown'}</td>
                                            <td className="py-3 px-4 text-muted-foreground font-mono">{item.sku}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{item.quantity}</td>
                                            <td className="py-3 px-4 text-foreground">R{Number(item.price).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-foreground">R{Number(item.tax).toLocaleString()}</td>
                                            <td className="py-3 px-4 font-bold text-foreground">R{(Number(item.price) * item.quantity + Number(item.tax)).toLocaleString()}</td>
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        Showing {((orderPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(orderPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                          disabled={orderPage === 1}
                          className="border-slate-600/50"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {orderPage} of {totalOrderPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))}
                          disabled={orderPage === totalOrderPages}
                          className="border-slate-600/50"
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">Payment</h1>
                    <p className="text-muted-foreground">Send a manual PayFast payment link by customer name</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10 font-bold bg-transparent gap-2"
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
                  <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Search Customer by Name</label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={paymentCustomerSearch}
                          onChange={(e) => {
                            setPaymentCustomerSearch(e.target.value)
                            setManualPaymentSuccess(null)
                          }}
                          placeholder="Type a customer name..."
                          className="pl-10 border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Matching Customers</p>
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
                                  ? 'border-red-500 bg-red-500/10'
                                  : 'border-slate-400/30 hover:border-red-500/40 hover:bg-slate-400/5'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-white">{customer.client_name || customer.full_name || 'Unnamed customer'}</p>
                                  <p className="text-xs text-slate-400">{customer.account_no}</p>
                                  <p className="text-xs text-slate-300 mt-1 break-all">{customer.email || customer.contact?.email || 'No email on file'}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-red-400 mt-1" />}
                              </div>
                            </button>
                          )
                        }) : (
                          <div className="rounded-lg border border-dashed border-slate-400/30 px-4 py-8 text-center text-slate-400">
                            No customers match this name.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#0056a1]/30 to-[#002463]/30 border border-slate-400/40 rounded-xl p-6 shadow-xl shadow-red-500/10 backdrop-blur-sm space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Selected Customer</p>
                      <p className="text-xl font-bold text-white mt-2">
                        {selectedPaymentCustomer?.client_name || selectedPaymentCustomer?.full_name || 'No customer selected'}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">{selectedPaymentCustomer?.account_no || 'Search and select a customer'}</p>
                      <p className="text-sm text-slate-300 mt-1 break-all">{selectedPaymentCustomer?.email || selectedPaymentCustomer?.contact?.email || 'No email on file yet'}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Amount (R)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={manualPaymentAmount}
                          onChange={(e) => setManualPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Note / Description</label>
                        <Textarea
                          value={manualPaymentNote}
                          onChange={(e) => setManualPaymentNote(e.target.value)}
                          placeholder="Optional note to include in the email"
                          className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-400/30 bg-black/10 p-4 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">From</p>
                        <p className="text-sm text-white font-medium break-all">kbc@notification.leadsync.co.za</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Link</p>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 rounded-md border border-slate-400/30 bg-white/5 px-3 py-2 text-sm text-slate-200 break-all">
                            {manualPaymentLinkPreview || 'Will be generated when you click Send Payment Link'}
                          </div>
                          {manualPaymentLinkPreview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                              onClick={() => navigator.clipboard.writeText(manualPaymentLinkPreview)}
                            >
                              Copy
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {manualPaymentError && (
                      <p className="text-sm text-red-400 font-medium">{manualPaymentError}</p>
                    )}
                    {manualPaymentSuccess && (
                      <p className="text-sm text-green-400 font-medium">{manualPaymentSuccess}</p>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all gap-2"
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
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">Settings</h1>
                  <p className="text-muted-foreground">Manage your account and system preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Security Settings Card */}
                  <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-6 py-4 border-b border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Security</h3>
                          <p className="text-xs text-muted-foreground">Password & authentication</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <button 
                        onClick={() => setShowChangePasswordModal(true)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-primary/50 transition-all group"
                      >
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                          <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-foreground">Change Password</p>
                          <p className="text-xs text-muted-foreground">Update your account password</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
                      </button>
                    </div>
                  </div>

                  {/* Email Settings Card */}
                  <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-6 py-4 border-b border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Notifications</h3>
                          <p className="text-xs text-muted-foreground">Email & alerts configuration</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <button 
                        onClick={() => setShowEmailSettingsModal(true)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 hover:border-blue-500/50 transition-all group"
                      >
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                          <Bell className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-foreground">Email Settings</p>
                          <p className="text-xs text-muted-foreground">Configure notification emails</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
                      </button>
                    </div>
                  </div>

                  {/* Company Info Card */}
                  <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden shadow-xl shadow-primary/10 backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-6 py-4 border-b border-primary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Company</h3>
                          <p className="text-xs text-muted-foreground">Business information</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                          <span className="text-muted-foreground">Company Name</span>
                          <span className="font-semibold text-foreground">KBC Trading</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                          <span className="text-muted-foreground">Support Email</span>
                          <span className="font-semibold text-foreground">support@kbc.co.za</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-muted-foreground">Version</span>
                          <span className="font-semibold text-emerald-400">v1.0.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl p-6 shadow-xl shadow-primary/10 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    System Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                          <p className="text-xs text-muted-foreground">Total Customers</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-emerald-400" />
                        <div>
                          <p className="text-2xl font-bold text-foreground">{products.length}</p>
                          <p className="text-xs text-muted-foreground">Total Products</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-amber-400" />
                        <div>
                          <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold text-foreground">R{orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Customer Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/40 rounded-xl shadow-2xl shadow-red-500/20 w-full max-w-4xl my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-6 border-b border-red-500/30 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold">Edit Account Details</h2>
                <p className="text-sm text-red-100">{editingCustomer.account_no}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-white"
                onClick={() => setEditingCustomer(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-slate-400/30 bg-black/20">
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
                        ? 'border-red-500 text-red-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
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
                      <label className="block text-sm font-bold text-slate-300 mb-2">Account No</label>
                      <Input value={editingCustomer.account_no} className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" readOnly />
                    </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Status</label>
                    <select 
                        value={formData.status ?? editingCustomer.status ?? ''} 
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border-slate-400/50 focus:border-red-500 bg-white/10 text-white rounded px-3 py-2 border font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Client Name</label>
                    <Input 
                      value={formData.client_name ?? editingCustomer.client_name ?? ''} 
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Address</label>
                    <Input 
                      value={formData.address ?? editingCustomer.address ?? ''} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                    />
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {customerModalTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Full Name</label>
                    <Input 
                      value={formData.full_name ?? editingCustomer.full_name ?? ''} 
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Phone Number</label>
                    <Input 
                      value={formData.phone_number ?? editingCustomer.phone_number ?? ''} 
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Business Type</label>
                    <Input 
                      value={formData.business_type ?? editingCustomer.business_type ?? ''} 
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                    <Input 
                      type="email"
                      value={formData.email ?? editingCustomer.email ?? ''} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                    />
                  </div>
                </div>
              )}

              {/* Login Tab */}
              {customerModalTab === 'login' && (
                <div className="space-y-4">
                  {!editingCustomer.user_id ? (
                    <>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                        <p className="text-blue-200 text-sm">This customer has no login yet. Create one below.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                        <Input 
                          type="email"
                          placeholder="customer@example.com"
                          value={formData.loginEmail || ''} 
                          onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                          className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                        <div className="flex gap-2 mb-2">
                          <Input 
                            type="text"
                            value={formData.loginPassword || ''} 
                            className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white flex-1" 
                            readOnly
                          />
                          <Button
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold"
                            onClick={() => {
                              const newPassword = Math.random().toString(36).substring(2, 10)
                              setFormData({ ...formData, loginPassword: newPassword })
                            }}
                          >
                            Generate
                          </Button>
                          {formData.loginPassword && (
                            <Button
                              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold"
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
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold"
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
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <p className="text-green-200 text-sm font-bold">Login Active</p>
                        </div>
                        <p className="text-green-100 text-xs">This customer has an active login account.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                        <Input 
                          value={editingCustomer.email || ''} 
                          className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white" 
                          readOnly 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Status</label>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            editingCustomer.user_status === 'approved' 
                              ? 'bg-green-500/20 border-green-500/50 text-green-300'
                              : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                          }`}>
                            {editingCustomer.user_status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-400/30 pt-4 space-y-3">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold gap-2"
                          onClick={() => {
                            const newPassword = Math.random().toString(36).substring(2, 10)
                            setFormData({ ...formData, resetPassword: newPassword })
                          }}
                        >
                          Reset Password
                        </Button>
                        <Button
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold gap-2"
                          onClick={() => setFormData({ ...formData, revokeAccess: true })}
                        >
                          Revoke Access
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-8 py-4 rounded-b-xl flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => setEditingCustomer(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all"
                onClick={async () => {
                  try {
                    const supabase = createClient()
                    const clientUpdates = {
                      client_name: formData.client_name ?? editingCustomer.client_name,
                      address: formData.address ?? editingCustomer.address,
                    }
                    
                    // Update clients table
                    const { error: clientError } = await supabase
                      .from('clients')
                      .update(clientUpdates)
                      .eq('account_no', editingCustomer.account_no)
                    
                    if (clientError) {
                      console.error('[v0] Error updating clients:', clientError)
                      alert(clientError.message || 'Error updating client details')
                      return
                    }

                    const contactUpdates = {
                      client_account_no: editingCustomer.account_no,
                      full_name: formData.full_name ?? editingCustomer.full_name ?? null,
                      email: formData.email ?? editingCustomer.email ?? null,
                      phone_number: formData.phone_number ?? editingCustomer.phone_number ?? null,
                      business_type: formData.business_type ?? editingCustomer.business_type ?? null,
                    }

                    const { error: contactError } = await supabase
                      .from('contacts')
                      .upsert(contactUpdates, { onConflict: 'client_account_no' })

                    if (contactError) {
                      console.error('[v0] Error updating contacts:', contactError)
                      alert(contactError.message || 'Error updating contact details')
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
                      const { error: userUpdateError } = await supabase
                        .from('users')
                        .update({
                          full_name: formData.full_name ?? editingCustomer.full_name,
                          phone_number: formData.phone_number ?? editingCustomer.phone_number,
                          business_type: formData.business_type ?? editingCustomer.business_type,
                          email: formData.email ?? editingCustomer.email,
                          status: formData.status ?? editingCustomer.status,
                        })
                        .eq('id', editingCustomer.user_id)

                      if (userUpdateError) {
                        console.error('[v0] Error updating users:', userUpdateError)
                        alert(userUpdateError.message || 'Error updating contact details')
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
                      const { error: revokeError } = await supabase
                        .from('users')
                        .update({ status: 'rejected' })
                        .eq('id', editingCustomer.user_id)

                      if (revokeError) {
                        console.error('[v0] Error revoking access:', revokeError)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600/80 to-green-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Login Created Successfully
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setCreatedLoginCredentials(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300 mb-6">Share these credentials with the client:</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
                  <div className="bg-white/5 border border-slate-400/30 rounded px-3 py-2 text-white font-mono text-sm break-all">
                    {createdLoginCredentials.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Temporary Password</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white/5 border border-slate-400/30 rounded px-3 py-2 text-white font-mono text-sm">
                      {'•'.repeat(createdLoginCredentials.password.length)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                      onClick={handleCopyPassword}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-xs text-yellow-200">
                The client must change their password on first login.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-lg shadow-green-600/50 hover:shadow-green-600/70 transition-all"
                onClick={() => setCreatedLoginCredentials(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Login Modal */}
      {selectedCustomerForLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Client Login</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setSelectedCustomerForLogin(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-300 mb-4">Create a login for <span className="font-bold text-white">{selectedCustomerForLogin.client_name}</span></p>
                <label className="block text-sm font-bold text-slate-300 mb-2">Email Address</label>
                <Input
                  type="email"
                  value={createLoginEmail}
                  onChange={(e) => setCreateLoginEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="border-slate-400/50 focus:border-blue-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              {createLoginError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {createLoginError}
                </div>
              )}

              {createLoginSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {createLoginSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => setSelectedCustomerForLogin(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600/80 to-red-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add New Product</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
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
                <label className="block text-sm font-bold text-slate-300 mb-2">Product Name</label>
                <Input
                  value={productFormData.title || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">SKU</label>
                  <Input
                    value={productFormData.sku || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Price</label>
                  <Input
                    type="number"
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Stock Quantity</label>
                  <Input
                    type="number"
                    value={productFormData.inventory_quantity || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, inventory_quantity: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Product Type</label>
                  <Input
                    value={productFormData.product_type || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Description</label>
                <Textarea
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>

              <div className="border-t border-slate-400/30 pt-4">
                <label className="block text-sm font-bold text-slate-300 mb-3">Product Image</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
                  {uploadingImage !== null && <span className="text-sm text-slate-300">Uploading...</span>}
                  {imageUploadError && <span className="text-sm text-red-400 font-medium">{imageUploadError}</span>}
                </div>
                {previewImage && (
                  <div className="mt-3">
                    <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-400/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => {
                  setShowAddProductModal(false)
                  setProductFormData({})
                  setPreviewImage(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all"
                disabled={savingProduct}
                onClick={() => handleAddProduct()}
              >
                {savingProduct ? 'Adding...' : 'Add Product'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600/80 to-red-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Product</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setEditingProduct(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Product Name</label>
                <Input
                  value={productFormData.title || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">SKU</label>
                  <Input
                    disabled
                    value={productFormData.sku || ''}
                    className="border-slate-400/50 bg-white/5 text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Price</label>
                  <Input
                    type="number"
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Stock Quantity</label>
                  <Input
                    type="number"
                    value={productFormData.inventory_quantity || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, inventory_quantity: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Product Type</label>
                  <Input
                    value={productFormData.product_type || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value })}
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Description</label>
                <Textarea
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>

              <div className="border-t border-slate-400/30 pt-4">
                <label className="block text-sm font-bold text-slate-300 mb-3">Product Image</label>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
                    {uploadingImage !== null && <span className="text-sm text-slate-300">Uploading...</span>}
                    {imageUploadError && <span className="text-sm text-red-400 font-medium">{imageUploadError}</span>}
                  </div>
                  {productGallery.length > 0 && (
                    <div className="mt-3">
                      <div className="grid grid-cols-4 gap-3">
                        {productGallery.map((imageUrl, index) => (
                          <div
                            key={`${imageUrl}-${index}`}
                            className={`relative rounded-lg border overflow-hidden transition-all ${
                              previewImage === imageUrl ? 'border-red-500 ring-2 ring-red-500/40' : 'border-slate-400/30 hover:border-red-500/40'
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
                              className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/70 text-white p-1.5 hover:bg-red-600 transition-colors disabled:opacity-60"
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
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-between gap-3">
              <Button
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10 font-bold bg-transparent"
                disabled={deletingProduct === editingProduct?.sku}
                onClick={() => handleDeleteProduct(editingProduct.sku)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingProduct === editingProduct?.sku ? 'Deleting...' : 'Delete Product'}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                  onClick={() => {
                    setEditingProduct(null)
                    setPreviewImage(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600/80 to-red-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Order {viewingOrder.order_number}</h2>
                <p className="text-xs opacity-80 mt-1">Order Details</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
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
                  <p className="text-sm text-slate-400 font-bold mb-1">Customer</p>
                  <p className="text-white font-bold">{viewingOrder.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-bold mb-1">Order Date</p>
                  <p className="text-white font-bold">{formatDate(viewingOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-bold mb-1">Items</p>
                  <p className="text-white font-bold">{viewingOrder.item_count}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-bold mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingOrder.payment_status)}`}>
                    {viewingOrder.payment_status}
                  </span>
                </div>
              </div>

              {/* Send Payment Link */}
              <div className="border-t border-slate-400/30 pt-4">
                <p className="text-sm text-slate-400 font-bold mb-3">Send Payment Link</p>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-400/30 bg-black/10 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">To</p>
                        <p className="text-sm text-white font-medium break-all">{viewingOrderEmail || 'No contact email available'}</p>
                        {viewingOrderContactName && (
                          <p className="text-xs text-slate-400 mt-1">Contact: {viewingOrderContactName}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">From</p>
                      <p className="text-sm text-white font-medium break-all">kbc@notification.leadsync.co.za</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Link</p>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 rounded-md border border-slate-400/30 bg-white/5 px-3 py-2 text-sm text-slate-200 break-all">
                          {paymentLinkPreview || 'Will be generated when you click Send via Email'}
                        </div>
                        {paymentLinkPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
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
                        className="flex-1 border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent gap-2"
                        disabled={sendingPaymentLink}
                        onClick={async () => {
                          try {
                            setSendingPaymentLink(true)
                            const paymentResponse = await fetch('/api/payfast/create-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: 1,
                                  client_id: viewingOrder.client_account_no,
                                  amount: viewingOrder.total_amount,
                                  item_name: `Order ${viewingOrder.order_number}`,
                                  item_description: `KBC Order - ${viewingOrder.item_count || viewingOrder.order_items?.length || 0} items`,
                                  name_first: viewingOrderContactName || viewingOrder.client_name || 'Customer',
                                  name_last: '',
                                  email_address: viewingOrderEmail,
                                  cell_number: '',
                                  custom_int1: '1',
                                  custom_str1: String(viewingOrder.id),
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
                      className="flex-1 border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent gap-2"
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
              <div className="border-t border-slate-400/30 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-300 font-bold">Total Amount</p>
                  <p className="text-2xl font-bold text-red-400">R{Number(viewingOrder.total_amount).toLocaleString()}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="border-t border-slate-400/30 pt-4 space-y-3">
                <div>
                  <p className="text-sm text-slate-400 font-bold mb-1">Order Number</p>
                  <p className="text-white font-mono">{viewingOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-bold mb-1">Payment Status</p>
                  <p className="text-white capitalize">{viewingOrder.payment_status}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => setViewingOrder(null)}
              >
                Close
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#0056a1]/40 to-[#002463]/40 border border-slate-400/30 rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600/80 to-purple-700/80 text-white border-b border-slate-400/30 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Admin
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
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
                <label className="block text-sm font-bold text-slate-300 mb-2">Full Name</label>
                <Input
                  value={addAdminFormData.full_name}
                  onChange={(e) => setAddAdminFormData({ ...addAdminFormData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  className="border-slate-400/50 focus:border-purple-500 bg-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                <Input
                  type="email"
                  value={addAdminFormData.email}
                  onChange={(e) => setAddAdminFormData({ ...addAdminFormData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="border-slate-400/50 focus:border-purple-500 bg-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                <Input
                  type="password"
                  value={addAdminFormData.password}
                  onChange={(e) => setAddAdminFormData({ ...addAdminFormData, password: e.target.value })}
                  placeholder="Enter password"
                  className="border-slate-400/50 focus:border-purple-500 bg-white/10 text-white"
                />
              </div>
            </div>
            <div className="border-t border-slate-400/30 bg-black/20 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => {
                  setShowAddAdminModal(false)
                  setAddAdminFormData({ email: '', full_name: '', password: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold"
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
                    const supabase = createClient()
                    const { data: users } = await supabase
                      .from('users')
                      .select('id, email, full_name, role, status')
                      .eq('role', 'admin')
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-6 border-b border-primary/30 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold">Change Password</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-white"
                onClick={() => setShowChangePasswordModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  className="border-slate-400/50 focus:border-primary bg-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  className="border-slate-400/50 focus:border-primary bg-white/10 text-white"
                />
              </div>
            </div>
            <div className="border-t border-slate-400/30 bg-black/20 px-8 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => setShowChangePasswordModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-6 border-b border-primary/30 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold">Email Settings</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-white"
                onClick={() => setShowEmailSettingsModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Company Name</label>
                <Input
                  placeholder="e.g., KBC Trading"
                  value={emailSettings.companyName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, companyName: e.target.value })}
                  className="border-slate-400/50 focus:border-primary bg-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Sender Email</label>
                <Input
                  type="email"
                  placeholder="noreply@kbc.co.za"
                  value={emailSettings.senderEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                  className="border-slate-400/50 focus:border-primary bg-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Sender Name</label>
                <Input
                  placeholder="KBC Support"
                  value={emailSettings.senderName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                  className="border-slate-400/50 focus:border-primary bg-white/10 text-white"
                />
              </div>
            </div>
            <div className="border-t border-slate-400/30 bg-black/20 px-8 py-4 flex justify-end gap-3 rounded-b-xl">
              <Button
                variant="outline"
                className="border-slate-400/50 text-slate-300 hover:text-slate-200 hover:bg-slate-400/10 font-bold bg-transparent"
                onClick={() => setShowEmailSettingsModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white font-bold"
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
    </div>
  )
}
