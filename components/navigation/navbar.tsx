'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Hide navbar on all portal pages
  if (pathname?.includes('/customer-login') || pathname?.includes('/admin') || pathname?.includes('/dashboard') || pathname?.includes('/enquiries')) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] backdrop-blur-md shadow-lg py-0">
      <div className="container mx-auto px-0 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group hover:opacity-90 transition-opacity h-full flex items-center px-4">
          <img src="/kbc-logo.png" alt="KBC" className="h-14 w-auto" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 pr-4">
          <Link href="/products" className="text-sm font-medium text-white hover:text-secondary transition-colors duration-200">
            Products
          </Link>
          <Link href="/about" className="text-sm font-medium text-white hover:text-secondary transition-colors duration-200">
            About
          </Link>
          <Link href="/services" className="text-sm font-medium text-white hover:text-secondary transition-colors duration-200">
            Services
          </Link>
          <Link href="/contact" className="text-sm font-medium text-white hover:text-secondary transition-colors duration-200">
            Contact
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3 pr-4">
          <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent transition-colors">
            <Search className="w-4 h-4" />
          </Button>
          <Button asChild className="bg-accent hover:bg-accent/90 text-white text-xs font-medium hidden sm:flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-accent hover:bg-accent/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link href="/products" className="text-sm font-medium text-white hover:text-secondary transition py-2">
              Products
            </Link>
            <Link href="/about" className="text-sm font-medium text-white hover:text-secondary transition py-2">
              About
            </Link>
            <Link href="/services" className="text-sm font-medium text-white hover:text-secondary transition py-2">
              Services
            </Link>
            <Link href="/contact" className="text-sm font-medium text-white hover:text-secondary transition py-2">
              Contact
            </Link>
            <Button asChild className="w-full bg-accent text-white text-xs font-medium mt-2">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
