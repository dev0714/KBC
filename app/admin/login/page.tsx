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
import { portalFontVars } from '@/components/portal/fonts'

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
    <div className={`kbc-portal ${portalFontVars} flex flex-col min-h-screen bg-[#F4F5F7]`}>
      <Navbar />

      <main className="bg-[#C8102E] hover:bg-[#A50D26] text-white flex-1 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#F8F9FB] rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#F8F9FB] rounded-full blur-3xl -z-10"></div>
        <div className="w-full max-w-md relative animate-fade-in-up">
          <div className="bg-white border border-[#E3E6EC] rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="bg-white inline-flex items-center justify-center w-16 h-16 rounded-lg mb-4">
                <span className="text-2xl font-bold text-[#121826]">A</span>
              </div>
              <h1 className="kbc-display text-[26px] font-semibold leading-8 mb-2">Admin Access</h1>
              <p className="text-[#5A6272] text-sm">
                Sign in to manage KBC operations
              </p>
            </div>

            {error && (
              <div className="bg-white mb-4 p-4 rounded-lg border border-destructive/50 text-[#A4161A] text-sm font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-bold mb-2 block text-[#121826]">
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
                  className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white/50 dark:bg-black/30 transition-all focus:ring-secondary/30 font-medium"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-bold mb-2 block text-[#121826]">
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
                    className="border-[#E3E6EC] focus:border-[#0F1B3D] bg-white/50 dark:bg-black/30 transition-all focus:ring-secondary/30 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#1D3A8A] hover:text-[#132A6B] transition-colors"
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
                className="bg-white w-full text-[#121826] font-bold py-3 transition-all duration-300 text-base"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
              </Button>
            </form>

            <div className="bg-white mt-6 p-4 rounded-lg border border-[#E3E6EC]">
              <p className="text-xs text-[#5A6272] text-center font-medium">
                Demo: Use any email and password to access the admin panel
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/contact" className="text-sm text-[#1D3A8A] hover:text-[#132A6B] font-bold transition-colors">
              Need help? Contact support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
