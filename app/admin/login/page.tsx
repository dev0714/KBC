'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (formData.email && formData.password) {
        window.location.href = '/admin'
      } else {
        setError('Please enter email and password')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div className="w-full max-w-md relative animate-fade-in-up">
          <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-2xl shadow-2xl shadow-primary/20 p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl mb-4 shadow-lg shadow-secondary/30">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">Admin Access</h1>
              <p className="text-muted-foreground text-sm">
                Sign in to manage KBC operations
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-destructive/20 to-secondary/20 border border-destructive/50 text-destructive text-sm font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-bold mb-2 block text-foreground">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@kbc.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border-primary/30 focus:border-secondary bg-white/50 dark:bg-black/30 backdrop-blur-sm transition-all focus:ring-secondary/30 font-medium"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-bold mb-2 block text-foreground">
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
                    className="border-primary/30 focus:border-secondary bg-white/50 dark:bg-black/30 backdrop-blur-sm transition-all focus:ring-secondary/30 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-secondary hover:text-secondary/70 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-bold py-3 shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all duration-300 text-base"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground text-center font-medium">
                Demo: Use any email and password to access the admin panel
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/contact" className="text-sm text-secondary hover:text-secondary/70 font-bold transition-colors">
              Need help? Contact support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
