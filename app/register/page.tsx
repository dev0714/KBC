'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    address: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    agree: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName) newErrors.fullName = 'Full name is required'
    if (!formData.company) newErrors.company = 'Company name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.phone) newErrors.phone = 'Phone is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!formData.agree) newErrors.agree = 'You must agree to the terms'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setServerError('')

    try {
      // Register user with custom auth endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          companyName: formData.company,
          phoneNumber: formData.phone,
          address: formData.address,
          businessType: formData.businessType || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setServerError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Success - show message without redirect
      setSubmitted(true)
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-6">
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Account Created</h1>
              <p className="text-muted-foreground mb-6">
                Your account has been created and is pending admin approval. You will be notified when access is granted.
              </p>
              <Button asChild className="w-full">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Join our wholesale network and access exclusive pricing
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-bold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium mb-2 block">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="John Smith"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1">{errors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+27 11 000 0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="border-t border-border pt-6">
                <h3 className="font-bold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company" className="text-sm font-medium mb-2 block">
                      Company Name *
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                    {errors.company && (
                      <p className="text-destructive text-xs mt-1">{errors.company}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="businessType" className="text-sm font-medium mb-2 block">
                      Business Type
                    </Label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select type...</option>
                      <option value="repair">Auto Repair Shop</option>
                      <option value="fleet">Fleet Services</option>
                      <option value="dealer">Parts Dealer</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="address" className="text-sm font-medium mb-2 block">
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Account Info */}
              <div className="border-t border-border pt-6">
                <h3 className="font-bold mb-4">Account Information</h3>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-xs mt-1">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    {errors.confirmPassword && (
                      <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="border-t border-border pt-6">
                {serverError && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {serverError}
                  </div>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agree"
                    checked={formData.agree}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">
                    I agree to the Terms of Service and Privacy Policy. I understand that my account
                    requires approval before access.
                  </span>
                </label>
                {errors.agree && (
                  <p className="text-destructive text-xs mt-1">{errors.agree}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-border">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/login">Already have an account?</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
