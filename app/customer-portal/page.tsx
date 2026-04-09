'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingCart, Package, TrendingUp, Clock } from 'lucide-react'

export default function CustomerPortalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] py-4 flex justify-end px-6 w-full">
        <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10 bg-transparent">
          <Link href="/">Back to Website</Link>
        </Button>
      </div>
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-300/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative">
            {/* Left: Features */}
            <div className="space-y-10 animate-fade-in-left">
              <div>
                <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-6 border border-accent/30">
                  <span className="text-lg">🔐</span>
                  <span className="text-xs font-bold text-accent tracking-widest">BUSINESS CUSTOMERS</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                  Customer Portal
                </h1>
                <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                  Access your exclusive business account to shop our complete product catalog, manage orders, and request quotes.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: ShoppingCart, title: 'Browse Full Catalog', description: 'Explore thousands of premium products with real-time pricing' },
                  { icon: Package, title: 'Order Management', description: 'Track shipments and manage your complete order history' },
                  { icon: TrendingUp, title: 'Custom Quotes', description: 'Request personalized quotes for bulk or specialty orders' },
                  { icon: Clock, title: 'Quick Ordering', description: 'Fast checkout with saved preferences and payment methods' },
                ].map((feature, idx) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="flex gap-4 p-5 rounded-xl bg-card/40 hover:bg-card/60 transition-all duration-300 border border-accent/20 shadow-sm animate-fade-in-up group" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="animate-fade-in-right">
              <div className="bg-card/50 border border-accent/20 rounded-2xl shadow-lg p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-10">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 group-hover:scale-105 transition-transform">
                      <Image 
                        src="/kbc-logo.png" 
                        alt="KBC Logo"
                        width={100}
                        height={100}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
                  <p className="text-muted-foreground text-base">
                    Sign in to your KBC business account
                  </p>
                </div>

                <div className="space-y-5 mb-8">
                  <div className="p-5 rounded-lg bg-accent/5 border border-accent/30">
                    <p className="text-sm font-bold text-foreground mb-2">Not Yet a Customer?</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Contact our sales team to set up your business account.
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full border-accent/30 text-accent hover:bg-accent/10 font-semibold bg-transparent">
                      <Link href="/contact">Request Account</Link>
                    </Button>
                  </div>

                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-accent/20"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-card/50 text-muted-foreground font-medium">Or sign in</span>
                    </div>
                  </div>

                  <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-all duration-300 gap-2">
                    <Link href="/customer-login" className="flex items-center justify-center">
                      Sign In to Portal
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-card/30 border border-accent/20">
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/30 border-t border-accent/10 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 KBC Brake & Clutch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
