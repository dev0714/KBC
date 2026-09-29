'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { portalFontVars } from '@/components/portal/fonts'
import { btn, input } from '@/components/portal/ui'
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

  const field = (
    name: keyof typeof formData,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    hint?: string,
  ) => {
    const note = errors[name] || hint
    return (
      <div className="flex flex-col gap-1.5 text-[13px] font-medium">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          value={formData[name] as string}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={note ? `${name}-note` : undefined}
          className={`${input} h-[42px] ${errors[name] ? 'border-[#D93A3A]' : ''}`}
          {...props}
        />
        {note && (
          <span id={`${name}-note`} className={`text-xs font-normal ${errors[name] ? 'text-[#A4161A]' : 'text-[#5A6272]'}`}>
            {note}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`kbc-portal ${portalFontVars} flex min-h-screen bg-white text-[#121826]`}>
      <section className="hidden w-[40%] max-w-[560px] flex-col bg-[#0F1B3D] px-14 py-12 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/kbc-logo.png" alt="" className="h-12 w-[72px] object-contain" />
          <span className="kbc-display text-[17px] font-bold text-white">KBC Brake &amp; Clutch</span>
        </Link>
        <div className="my-auto flex flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9AA5C1]">Open a trade account</span>
            <h1 className="kbc-display text-[36px] font-semibold leading-[42px] tracking-tight text-white">
              Order brake and clutch parts online, at your account prices.
            </h1>
          </div>
          <ol className="flex flex-col gap-4">
            {[
              ['Register your business', 'Takes about two minutes.'],
              ['We approve your account', 'Our team checks the details and activates your login.'],
              ['Order and pay online', 'Pay with PayFast, or apply for 30-day credit terms.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3.5">
                <span className="kbc-mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3A4A78] text-[13px] text-white">{i + 1}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-white">{t}</span>
                  <span className="text-sm text-[#AEB8D0]">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-1 text-[13px] text-[#9AA5C1]">
          <span>West Point Trading 55 CC t/a KBC Brake &amp; Clutch</span>
          <span>
            Stephenson Str. (Cnr. Newton), Wemmer, Johannesburg · <span className="kbc-mono">011 493 1336</span>
          </span>
        </div>
      </section>

      <section className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#5A6272] hover:text-[#121826]">
            <ArrowLeft className="h-4 w-4" /> Back to website
          </Link>
          <Link href="/login" className="text-sm font-medium text-[#1D3A8A] hover:underline">
            Already registered? Sign in
          </Link>
        </div>

        <div className="flex flex-1 justify-center px-5 pb-14 pt-4 sm:px-8 lg:items-center">
          {submitted ? (
            <div className="flex w-full max-w-[440px] flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F4EE] text-[#0B6B41]">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="kbc-display text-[26px] font-semibold">Registration received</h2>
              <p className="text-sm leading-[21px] text-[#5A6272]">
                Your account is waiting for approval by our team. We will let you know by email at{' '}
                <span className="font-medium text-[#121826]">{formData.email}</span> once you can sign in.
              </p>
              <div className="mt-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href="/" className={btn.secondary}>
                  Back to website
                </Link>
                <Link href="/credit-application" className={btn.navy}>
                  Apply for credit
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-[560px] flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="kbc-display text-[28px] font-semibold leading-9">Open an account</h2>
                <p className="text-sm leading-[21px] text-[#5A6272]">
                  Accounts are approved by our team before you can sign in. Fields marked * are required.
                </p>
              </div>

              {serverError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-md border border-[#F4C7C3] bg-[#FDECEA] px-3.5 py-3 text-sm text-[#A4161A]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {serverError}
                </div>
              )}

              <fieldset className="flex flex-col gap-4">
                <legend className="kbc-display mb-4 text-[17px] font-semibold">Your business</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('company', 'Company name *', { autoComplete: 'organization' })}
                  <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                    <label htmlFor="businessType">Business type</label>
                    <select id="businessType" name="businessType" value={formData.businessType} onChange={handleInputChange} className={`${input} h-[42px]`}>
                      <option value="">Select…</option>
                      <option value="repair">Auto repair shop</option>
                      <option value="fleet">Fleet services</option>
                      <option value="dealer">Parts dealer</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                  <label htmlFor="address">Business address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                    autoComplete="street-address"
                    className="w-full rounded-md border border-[#D5DAE2] px-3 py-2.5 text-sm outline-none focus:border-[#0F1B3D] focus:ring-2 focus:ring-[#0F1B3D]/15"
                  />
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="kbc-display mb-4 w-full border-t border-[#EEF0F3] pt-6 text-[17px] font-semibold">Contact person</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('fullName', 'Full name *', { autoComplete: 'name' })}
                  {field('phone', 'Phone number *', { type: 'tel', autoComplete: 'tel', placeholder: '011 000 0000' })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="kbc-display mb-4 w-full border-t border-[#EEF0F3] pt-6 text-[17px] font-semibold">Sign-in details</legend>
                {field('email', 'Email address *', { type: 'email', autoComplete: 'email', placeholder: 'you@company.co.za' }, 'You will use this to sign in.')}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 text-[13px] font-medium">
                    <label htmlFor="password">Password *</label>
                    <div
                      className={`flex h-[42px] items-center rounded-md border pl-3 focus-within:border-[#0F1B3D] focus-within:ring-2 focus-within:ring-[#0F1B3D]/15 ${
                        errors.password ? 'border-[#D93A3A]' : 'border-[#D5DAE2]'
                      }`}
                    >
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby="password-note"
                        className="h-full flex-1 border-0 bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="flex h-full items-center px-3 text-[#1D3A8A]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <span id="password-note" className={`text-xs font-normal ${errors.password ? 'text-[#A4161A]' : 'text-[#5A6272]'}`}>
                      {errors.password || 'At least 8 characters'}
                    </span>
                  </div>
                  {field('confirmPassword', 'Confirm password *', { type: showPassword ? 'text' : 'password', autoComplete: 'new-password' })}
                </div>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-3 border-t border-[#EEF0F3] pt-6 text-sm" aria-invalid={Boolean(errors.agree)}>
                <input type="checkbox" name="agree" checked={formData.agree} onChange={handleInputChange} className="mt-0.5 h-4 w-4 accent-[#0F1B3D]" />
                <span className="text-[#3D4452]">
                  I agree to the{' '}
                  <Link href="/terms-and-conditions" className="text-[#1D3A8A] underline">
                    terms and conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="text-[#1D3A8A] underline">
                    privacy policy
                  </Link>
                  , and understand my account needs approval before I can sign in.
                  {errors.agree && <span className="mt-1 block text-xs text-[#A4161A]">{errors.agree}</span>}
                </span>
              </label>

              <button type="submit" disabled={loading} className={`${btn.primary} h-[46px] text-[15px]`}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
              <ul className="flex flex-col gap-2 rounded-md bg-[#F4F5F7] p-4 text-[13px] text-[#5A6272] lg:hidden">
                {['Accounts are approved by our team', 'Pay online with PayFast, or apply for credit terms'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#0B6B41]" />
                    {t}
                  </li>
                ))}
              </ul>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
