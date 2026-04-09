'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-card border-t border-accent/20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-foreground">KBC Brake & Clutch</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium brake and clutch components since 2001. Trusted by leading automotive businesses across Southern Africa.
            </p>
          </div>

          {/* Products and Company - Side by Side */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            {/* Products */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Products</h4>
              <div className="space-y-2 text-sm">
                <div className="block">
                  <Link href="/products" className="text-muted-foreground hover:text-accent transition-colors">
                    Brake Components
                  </Link>
                </div>
                <div className="block">
                  <Link href="/products" className="text-muted-foreground hover:text-accent transition-colors">
                    Clutch Components
                  </Link>
                </div>
                <div className="block">
                  <Link href="/products" className="text-muted-foreground hover:text-accent transition-colors">
                    Bearings
                  </Link>
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About Us
                </Link>
                <Link href="/services" className="text-muted-foreground hover:text-accent transition-colors">
                  Services
                </Link>
                <Link href="/contact" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Legal</h4>
            <div className="space-y-2 text-sm">
              <div className="block">
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </div>
              <div className="block">
                <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-accent transition-colors">
                  Terms and Conditions
                </Link>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Contact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>6 Stephenson Street, Wemmer, Johannesburg</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>+27 11 493 1336</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>kbc1@telkomsa.net</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-accent/10 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 KBC Brake & Clutch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
