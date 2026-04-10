'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, Clock3, Shield, Truck } from 'lucide-react'
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
      // Sign in with custom auth endpoint
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

      // Check role and redirect accordingly
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06123dcc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-slate-300 hover:text-white">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3 text-right">
            <img src="/images/kbc-logo.png" alt="KBC Logo" className="h-10 w-auto object-contain" />
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.45em] text-slate-400">Customer Portal</p>
              <p className="text-sm font-bold text-white">Sign in securely</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl grid-cols-1 lg:grid-cols-2">
        <section className="relative flex items-center overflow-hidden px-4 py-12 lg:px-8 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.45em] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]" />
              KBC Customer Portal
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              A cleaner way to manage your KBC account.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-200 sm:text-lg">
              Access your products, orders, documents, and payments in one place. The portal keeps your business moving with a simple login and a focused dashboard built around day-to-day work.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { title: 'Fast access', text: 'Jump straight into your order and product workspace.', icon: CheckCircle2 },
                { title: 'Secure login', text: 'Protected customer access for approved accounts only.', icon: Shield },
                { title: 'Live updates', text: 'Track orders, documents, and payment activity in real time.', icon: Clock3 },
                { title: 'Quick support', text: 'Reach KBC support whenever you need help.', icon: Truck },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-5 w-5 text-red-300" />
                      </div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="flex items-center px-4 py-12 lg:px-8 lg:py-16">
          <div className="w-full">
            <div className="mx-auto w-full max-w-md rounded-[28px] border border-slate-400/30 bg-[#06123d]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 text-center">
                <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">Sign In</p>
                <h2 className="mt-3 text-3xl font-black text-white">Welcome back</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Use your customer account details to continue to the portal.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/50 bg-red-600/20 p-4 text-sm font-medium text-red-100 shadow-lg shadow-red-500/10">
                  {error}
                </div>
              )}

              {checkingRole && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-500/50 bg-blue-600/20 p-4 text-sm font-medium text-blue-100 shadow-lg shadow-blue-500/10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading || checkingRole}
                    className="border-slate-400/40 bg-white/10 text-white placeholder:text-slate-400 backdrop-blur-sm transition-all focus:border-red-500 focus:ring-red-500/30 dark:bg-white/5"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={loading || checkingRole}
                      className="border-slate-400/40 bg-white/10 text-white placeholder:text-slate-400 backdrop-blur-sm transition-all focus:border-red-500 focus:ring-red-500/30 dark:bg-white/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-300 transition-colors hover:text-red-400 disabled:opacity-50"
                      disabled={loading || checkingRole}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <label className="flex cursor-pointer items-center gap-2 group">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleInputChange}
                      disabled={loading || checkingRole}
                      className="cursor-pointer rounded border-slate-400/50 bg-white/10 accent-red-500 disabled:opacity-50 dark:bg-white/5"
                    />
                    <span className="text-sm text-slate-300 transition-colors group-hover:text-red-400">Remember me</span>
                  </label>
                  <Link href="/contact" className="text-sm font-medium text-slate-300 transition-colors hover:text-red-400">
                    Need help?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-red-600 to-red-700 text-base font-bold text-white shadow-lg shadow-red-600/50 transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:shadow-red-600/70 disabled:opacity-50"
                  disabled={loading || checkingRole}
                >
                  {checkingRole ? (
                    <>
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Checking role...
                    </>
                  ) : loading ? (
                    'Signing in...'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/contact" className="text-sm font-bold text-red-400 transition-colors hover:text-red-300">
                  Need help? Contact support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
