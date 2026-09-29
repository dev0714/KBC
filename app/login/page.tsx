'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { portalFontVars } from '@/components/portal/fonts'
import { btn, input } from '@/components/portal/ui'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingRole, setCheckingRole] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      setCheckingRole(true)
      if (data.role === 'admin') {
        router.push('/admin')
      } else if (data.role === 'client') {
        if (data.status === 'pending') {
          setError('Your account is pending admin approval')
          setCheckingRole(false)
          setLoading(false)
          return
        }

        if (data.status === 'rejected') {
          setError('Your account has been rejected. Please contact support.')
          setCheckingRole(false)
          setLoading(false)
          return
        }

        if (data.status === 'approved') {
          router.push('/dashboard')
        } else {
          setError(`Unknown account status: ${data.status}`)
          setCheckingRole(false)
          setLoading(false)
        }
      } else {
        setError(`Unknown role: ${data.role}`)
        setCheckingRole(false)
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('[v0] Login error:', err)
      setCheckingRole(false)
      setLoading(false)
    }
  }

  const busy = loading || checkingRole

  return (
    <div className={`kbc-portal ${portalFontVars} flex min-h-screen bg-white text-[#121826]`}>
      <section className="hidden w-[44%] max-w-[600px] flex-col bg-[#0F1B3D] px-14 py-12 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/kbc-logo.png" alt="" className="h-12 w-[72px] object-contain" />
          <span className="kbc-display text-[17px] font-bold text-white">KBC Brake &amp; Clutch</span>
        </Link>
        <div className="my-auto flex flex-col gap-7">
          <div className="flex flex-col gap-3.5">
            <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9AA5C1]">Trade client portal</span>
            <h1 className="kbc-display text-[40px] font-semibold leading-[46px] tracking-tight text-white">
              Brake and clutch parts for your business, on your account.
            </h1>
          </div>
          <ul className="flex flex-col gap-3.5">
            {[
              'Order parts and pay securely online',
              'Track orders and download invoices and statements',
              'Apply for a 30-day credit account online',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] leading-[22px] text-[#D5DCEC]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#3A4A78] text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                {t}
              </li>
            ))}
          </ul>
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
          <img src="/images/kbc-logo.png" alt="KBC Brake &amp; Clutch" className="h-9 w-14 object-contain lg:hidden" />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="flex w-full max-w-[400px] flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="kbc-display text-[28px] font-semibold leading-9">Sign in</h2>
              <p className="text-sm leading-[21px] text-[#5A6272]">Use the email address registered on your KBC account.</p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-md border border-[#F4C7C3] bg-[#FDECEA] px-3.5 py-3 text-sm text-[#A4161A]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label htmlFor="email" className="flex flex-col gap-1.5 text-[13px] font-medium">
                Email address
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.co.za"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={busy}
                  className={input + ' h-[42px]'}
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px] font-medium">
                  <label htmlFor="password">Password</label>
                  <Link href="/contact" className="text-[#1D3A8A] hover:underline">
                    Forgotten it? Contact us
                  </Link>
                </div>
                <div className="flex h-[42px] items-center rounded-md border border-[#D5DAE2] pl-3 focus-within:border-[#0F1B3D] focus-within:ring-2 focus-within:ring-[#0F1B3D]/15">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={busy}
                    className="h-full flex-1 border-0 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={busy}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="flex h-full items-center gap-1.5 px-3 text-[13px] font-medium text-[#1D3A8A]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  disabled={busy}
                  className="h-4 w-4 accent-[#0F1B3D]"
                />
                Keep me signed in on this device
              </label>

              <button type="submit" disabled={busy} className={`${btn.primary} h-[46px] text-[15px]`}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {checkingRole ? 'Opening your account…' : loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="flex items-center gap-3 text-xs text-[#5A6272]">
              <span className="h-px flex-1 bg-[#E3E6EC]" />
              New to KBC?
              <span className="h-px flex-1 bg-[#E3E6EC]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/register" className={btn.secondary}>
                Open an account
              </Link>
              <Link href="/credit-application" className={btn.secondary}>
                Apply for credit
              </Link>
            </div>
            <p className="text-center text-[13px] text-[#5A6272]">
              Trouble signing in? Call the sales desk on <span className="kbc-mono">011 493 1336</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
