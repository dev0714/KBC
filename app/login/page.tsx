'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1]">
      <header className="sticky top-0 z-40 py-4 px-4 border-b border-slate-400/20">
        <div className="container mx-auto flex items-center justify-start">
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md relative animate-fade-in-up">
          <div className="bg-gradient-to-br from-[#0056a1]/20 to-[#002463]/20 border border-slate-400/40 rounded-2xl shadow-2xl shadow-red-500/10 p-8 backdrop-blur-sm hover:border-red-500/30 transition-colors">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <img src="/images/kbc-logo.png" alt="KBC Logo" className="h-24 w-auto object-contain" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-[#0056a1] to-slate-300 bg-clip-text text-transparent mb-2">KBC Portal</h1>
              <p className="text-slate-300 text-sm">
                Sign in to your account
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-red-600/30 to-red-500/20 border border-red-500/70 text-red-100 text-sm font-medium animate-fade-in-up shadow-lg shadow-red-500/20">
                {error}
              </div>
            )}

            {checkingRole && (
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-600/30 to-blue-500/20 border border-blue-500/70 text-blue-100 text-sm font-medium animate-fade-in-up shadow-lg shadow-blue-500/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-bold mb-2 block text-slate-200">
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
                  className="border-slate-400/50 focus:border-red-500 bg-white/10 dark:bg-white/5 backdrop-blur-sm transition-all focus:ring-red-500/30 font-medium text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-bold mb-2 block text-slate-200">
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
                    className="border-slate-400/50 focus:border-red-500 bg-white/10 dark:bg-white/5 backdrop-blur-sm transition-all focus:ring-red-500/30 font-medium text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
                    disabled={loading || checkingRole}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleInputChange}
                    disabled={loading || checkingRole}
                    className="rounded border-slate-400/50 bg-white/10 dark:bg-white/5 cursor-pointer accent-red-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-red-400 transition-colors">Remember me</span>
                </label>
                <Link
                  href="#"
                  className="text-sm text-slate-300 hover:text-red-400 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 shadow-lg shadow-red-600/50 hover:shadow-red-600/70 transition-all duration-300 text-base disabled:opacity-50"
                disabled={loading || checkingRole}
              >
                {checkingRole ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Checking role...
                  </>
                ) : loading ? (
                  'Signing in...'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>


          </div>

          <div className="mt-8 text-center">
            <Link href="/contact" className="text-sm text-red-400 hover:text-red-300 font-bold transition-colors">
              Need help? Contact support
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
