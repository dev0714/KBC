'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function CustomerLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    setTimeout(() => {
      if (formData.email && formData.password) {
        window.location.href = '/dashboard'
      } else {
        setError('Please enter your email and password')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-transparent px-4 py-4 flex justify-end">
        <Button asChild variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 bg-transparent">
          <Link href="/customer-portal">Back</Link>
        </Button>
      </div>

      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-300/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="w-full max-w-md relative animate-fade-in-up">
          <div className="bg-card/50 border border-accent/20 rounded-2xl shadow-lg p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-xl mb-4 border border-accent/30">
                <span className="text-2xl font-bold text-accent">🔑</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Customer Login
              </h1>
              <p className="text-muted-foreground">
                Sign in to access your KBC business account
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-bold mb-2 block text-foreground">
                  Business Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border-accent/30 focus:border-accent bg-card/40 dark:bg-card/40 backdrop-blur-sm transition-all focus:ring-accent/30 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="text-sm font-bold text-foreground">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-xs font-bold text-accent hover:text-accent/70 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="border-accent/30 focus:border-accent bg-card/40 dark:bg-card/40 backdrop-blur-sm transition-all focus:ring-accent/30 font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-accent hover:text-accent/70 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-accent/30 text-accent focus:ring-accent/30 cursor-pointer"
                />
                <Label htmlFor="remember" className="text-sm font-medium text-foreground cursor-pointer">
                  Remember me on this device
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all duration-300 text-base"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In to Portal'}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-accent/5 border border-accent/30">
              <p className="text-xs text-muted-foreground text-center font-medium">
                Demo: Use any email and password to access the portal
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Don't have an account?</p>
              <Button asChild variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/10 font-bold bg-transparent">
                <Link href="/contact">Become a KBC Customer</Link>
              </Button>
            </div>

            <div className="mt-8 text-center">
              <Link href="/customer-portal" className="text-sm text-accent hover:text-accent/70 font-bold transition-colors">
                Back to Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-card/30 border-t border-accent/10 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 KBC Brake &amp; Clutch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
