'use client'

import Link from 'next/link'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Heart, Share2, Download, ArrowLeft, CheckCircle2, Truck, Shield } from 'lucide-react'

const productDetails = {
  1: { name: 'Brake Shoe Set HD', sku: 'BS-HD-001', category: 'brake', price: 1200, stock: 45, description: 'Professional grade heavy-duty brake shoes designed for commercial and industrial applications. High friction coefficient, excellent heat dissipation, and extended service life.', specs: { material: 'Metallic', temp_range: '-20°C to 200°C', applications: '500+', warranty: '12 months' } },
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = productDetails[params.id as keyof typeof productDetails] || productDetails[1]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/customer/catalog" className="hover:text-secondary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Product Image */}
            <div className="flex flex-col gap-4">
              <div className="h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center text-8xl">
                <span>🛑</span>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <p className="text-sm text-secondary font-bold mb-2">SKU: {product.sku}</p>
              <h1 className="text-4xl font-bold mb-4 text-foreground">{product.name}</h1>
              
              <div className="mb-6 pb-6 border-b border-primary/20">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-foreground">R{product.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">per unit</span>
                </div>
                
                {product.stock > 0 ? (
                  <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/50">
                    In Stock - {product.stock} available
                  </span>
                ) : (
                  <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/50">
                    Out of Stock
                  </span>
                )}
              </div>

              <p className="text-lg text-muted-foreground mb-8">{product.description}</p>

              {/* Specifications */}
              <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Material</p>
                    <p className="font-bold text-foreground">{product.specs.material}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature Range</p>
                    <p className="font-bold text-foreground">{product.specs.temp_range}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Applications</p>
                    <p className="font-bold text-foreground">{product.specs.applications}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty</p>
                    <p className="font-bold text-foreground">{product.specs.warranty}</p>
                  </div>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3 mb-8">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <input type="number" defaultValue="1" min="1" className="w-full px-4 py-2 border border-primary/30 rounded-lg focus:border-secondary focus:ring-secondary/30" />
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Button size="lg" className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-bold shadow-lg shadow-secondary/30 gap-2" disabled={product.stock === 0}>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="w-full border-primary/30 hover:border-secondary/50 gap-2 bg-transparent">
                  <Heart className="w-5 h-5" />
                  Add to Wishlist
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3 p-6 bg-card border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-foreground">Quality Guaranteed</p>
                    <p className="text-muted-foreground">ISO certified manufacturing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-foreground">Fast Delivery</p>
                    <p className="text-muted-foreground">Same-day service available</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-foreground">12-Month Warranty</p>
                    <p className="text-muted-foreground">Full replacement guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download & Share */}
          <div className="border-t border-primary/20 pt-8 flex gap-4 justify-center">
            <Button variant="outline" className="border-primary/30 hover:border-secondary/50 gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Download Datasheet
            </Button>
            <Button variant="outline" className="border-primary/30 hover:border-secondary/50 gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share Product
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
