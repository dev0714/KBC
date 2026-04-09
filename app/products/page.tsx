'use client'

import React from "react"
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Package, Settings, Wrench, Zap } from 'lucide-react'

const productCategories = [
  {
    id: 'brake-components',
    name: 'Brake Components',
    description: 'KBC Brake Pads, Brake Shoes, Brake Discs, Earth Moving Brake Pads, and G-Force Brake Pads',
    icon: Package,
    image: '/images/category-brake-pads.jpg',
    products: ['KBC Brake Pads', 'KBC Brake Shoes', 'Brake Discs', 'Earth Moving Brake Pads', 'G-Force Brake Pads'],
  },
  {
    id: 'bearings',
    name: 'Bearings',
    description: 'Clutch Release Bearings, Concentric Slave Cylinders, and Heavy Duty Release Bearings',
    icon: Settings,
    image: '/images/category-clutch-assembly.jpg',
    products: ['Clutch Release Bearings', 'Concentric Slave Cylinder', 'Heavy Duty Release Bearings'],
  },
  {
    id: 'clutch-components',
    name: 'Clutch Components',
    description: 'Clutch Plates, Self Adjusting Clutch Kits, Exedy Clutch Kits, Flywheels, and Heavy Duty Clutch',
    icon: Wrench,
    image: '/images/category-clutch-kits.jpg',
    products: ['Clutch Plates', 'Self Adjusting Clutch Kits', 'Exedy Clutch Kits', 'Flywheels', 'Heavy Duty Clutch'],
  },
  {
    id: 'bonders-range',
    name: 'Bonders Range',
    description: 'Clutch Facings, Brake Linings, Flatsheets, Rivets, Roll Linings, Sintered Buttons, and Segments',
    icon: Zap,
    image: '/images/category-bonders.jpg',
    products: ['Clutch Facings', 'Brake Linings', 'Flatsheets', 'Rivets', 'Roll Linings', 'Sintered Buttons', 'Segments'],
  },
  {
    id: 'tractor-components',
    name: 'Tractor Components',
    description: 'Specialized components for agricultural and heavy machinery tractor applications',
    icon: Wrench,
    image: '/images/category-tractor.jpg',
    products: ['Tractor Brake Components', 'Tractor Clutch Parts', 'Agricultural Bearings'],
  },
]

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [selectedType, setSelectedType] = React.useState('all')
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'brake-components', label: 'Brake Components' },
    { value: 'bearings', label: 'Bearings' },
    { value: 'clutch-components', label: 'Clutch Components' },
    { value: 'bonders-range', label: 'Bonders Range' },
    { value: 'tractor-components', label: 'Tractor Components' },
  ]
  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'brake', label: 'Brake' },
    { value: 'clutch', label: 'Clutch' },
    { value: 'hydraulic', label: 'Hydraulic' },
    { value: 'machinery', label: 'Machinery' },
  ]
  const products = [
    { id: '1', name: 'Brake Shoes', sku: 'BS123', type: 'brake', price: 'R1,250', image: '/images/category-brake-pads.jpg', dimensions: '280x120x25mm' },
    { id: '2', name: 'Clutch Plates', sku: 'CP456', type: 'clutch', price: 'R2,450', image: '/images/category-clutch-kits.jpg', dimensions: '228x150x3mm' },
    { id: '3', name: 'Light-Duty Bearings', sku: 'LDB789', type: 'hydraulic', price: 'R1,650', image: '/images/category-bearings.jpg', dimensions: '45x100x25mm' },
    { id: '4', name: 'Disc Lathes', sku: 'DL012', type: 'machinery', price: 'R8,900', image: '/images/category-hydraulic-bearings.jpg', dimensions: '330x80x15mm' },
  ]

  const filteredProducts = products.filter((product) => {
    return (
      (selectedCategory === 'all' || product.id.includes(selectedCategory)) &&
      (selectedType === 'all' || product.type === selectedType) &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="relative overflow-hidden py-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center min-h-[450px]">
            {/* Image Side */}
            <div className="relative h-[350px] md:h-[450px] overflow-hidden order-2 md:order-2">
              <Image 
                src="/images/products-showcase-clutch.jpg" 
                alt="Product Showcase" 
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent"></div>
            </div>
            
            {/* Content Side */}
            <div className="px-6 md:px-12 py-12 md:py-0 order-1 md:order-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                Our Product Categories
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                KBC Brake & Clutch manufactures and distributes a comprehensive range of quality components for automotive applications across Southern Africa.
              </p>
              <p className="text-lg text-muted-foreground font-medium">
                To view our full product catalog with detailed specifications and pricing, please log in to your customer account or become a KBC customer today.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-20 md:py-28 px-4">
          <div className="container mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">Product Categories</h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Browse our comprehensive range of automotive components
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {productCategories.map((category, idx) => {
                const Icon = category.icon
                return (
                  <div
                    key={category.id}
                    className="overflow-hidden border border-accent/20 rounded-lg hover:border-accent/40 transition-all duration-300 group"
                  >
                    {/* Category Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-card/50">
                      <Image
                        src={category.image || "/placeholder.svg"}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Category Info */}
                    <div className="p-8 hover:bg-card/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-accent" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">{category.name}</h3>
                      </div>
                      
                      <p className="text-muted-foreground mb-6 leading-relaxed text-sm">{category.description}</p>
                      
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {category.products.map((product) => (
                            <span key={product} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button asChild className="bg-accent hover:bg-accent/90 text-white text-sm font-medium gap-2">
                        <Link href="/login">
                          View Catalog
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Information Section */}
        <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] border-y border-accent/10">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Quality Standards</h2>
              <p className="text-lg text-white/80">
                All KBC products are manufactured to the highest quality standards and engineered for reliability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Quality Assurance', description: 'Every component undergoes rigorous testing for reliability' },
                { title: 'Wide Application', description: '500+ vehicle applications for light and heavy-duty vehicles' },
                { title: 'Technical Support', description: 'Expert team provides technical assistance and recommendations' },
                { title: 'Competitive Pricing', description: 'Volume discounts and competitive pricing for all customers' },
              ].map((item, idx) => (
                <div key={item.title} className="p-6 border-2 border-white/20 rounded-lg hover:bg-white/10 hover:border-white/40 transition-all bg-white/5">
                  <h4 className="font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-white/80">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden bg-background">
          {/* Brake disc pattern background */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' strokeWidth='2'%3E%3Ccircle cx='100' cy='100' r='80'/%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cline x1='100' y1='20' x2='100' y2='50'/%3E%3Cline x1='156.6' y1='43.4' x2='135.4' y2='64.6'/%3E%3Cline x1='180' y1='100' x2='150' y2='100'/%3E%3Cline x1='156.6' y1='156.6' x2='135.4' y2='135.4'/%3E%3Cline x1='100' y1='180' x2='100' y2='150'/%3E%3Cline x1='43.4' y1='156.6' x2='64.6' y2='135.4'/%3E%3Cline x1='20' y1='100' x2='50' y2='100'/%3E%3Cline x1='43.4' y1='43.4' x2='64.6' y2='64.6'/%3E%3Ccircle cx='100' cy='100' r='12' fill='%23ef4444'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: 'repeat'}}></div>

          <div className="container mx-auto text-center max-w-2xl relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Access Our Full Catalog</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Log in to your customer account to view detailed product information, pricing, and place orders
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white font-semibold">
                <Link href="/login">Customer Login</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border border-accent/30 text-accent hover:bg-accent/5 bg-transparent">
                <Link href="/contact">Become a Customer</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Product Catalog */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/20 via-secondary/10 to-background border-b border-primary/20 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
          <div className="relative container mx-auto">
            <h1 className="mb-4 animate-fade-in-down">Our Product Catalog</h1>
            <p className="text-lg text-muted-foreground animate-fade-in-up">
              Browse our complete range of brake and clutch components
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-20 space-y-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 backdrop-blur-sm">
                  <h3 className="font-bold mb-3 text-lg">Search</h3>
                  <div className="relative">
                    <Input
                      placeholder="Search by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-primary/30 focus:border-secondary bg-white/50 dark:bg-black/30 backdrop-blur-sm transition-all focus:ring-secondary/30"
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-secondary" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 backdrop-blur-sm">
                  <h3 className="font-bold mb-3 text-lg">Category</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 font-medium ${
                          selectedCategory === cat.value
                            ? 'bg-gradient-to-r from-secondary to-secondary/80 text-white shadow-lg shadow-secondary/30'
                            : 'hover:bg-primary/10 border border-transparent hover:border-primary/30'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 backdrop-blur-sm">
                  <h3 className="font-bold mb-3 text-lg">Type</h3>
                  <div className="space-y-2">
                    {types.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 font-medium ${
                          selectedType === type.value
                            ? 'bg-gradient-to-r from-secondary to-secondary/80 text-white shadow-lg shadow-secondary/30'
                            : 'hover:bg-primary/10 border border-transparent hover:border-primary/30'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-2 border-primary/30 hover:bg-primary/10 hover:border-secondary/50 font-bold transition-all duration-300 bg-transparent"
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedType('all')
                    setSearchQuery('')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="md:col-span-3">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground font-semibold">
                  Showing <span className="text-secondary font-bold">{filteredProducts.length}</span> of <span className="text-primary font-bold">{products.length}</span> products
                </p>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product, idx) => (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <div className="rounded-xl bg-gradient-to-br from-card to-card/50 border border-primary/20 hover:border-secondary/50 hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300 group cursor-pointer h-full flex flex-col hover:-translate-y-2 animate-fade-in-up overflow-hidden" style={{ animationDelay: `${idx * 0.1}s` }}>
                        {/* Product Image */}
                        <div className="relative w-full h-48 overflow-hidden bg-card/50">
                          <Image
                            src={product.image || '/placeholder.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-6 flex flex-col h-full">
                          <div className="mb-4">
                            <h3 className="font-bold mb-1 text-lg group-hover:text-secondary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">SKU: {product.sku}</p>
                          </div>

                          <div className="mb-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-secondary/20 to-primary/20 text-secondary border border-secondary/30">
                              {product.type}
                            </span>
                          </div>

                          {/* Dimensions */}
                          <div className="mb-4 p-3 rounded-lg bg-accent/5 border border-accent/20">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Dimensions</p>
                            <p className="text-sm font-bold text-foreground">{product.dimensions}</p>
                          </div>

                          <p className="text-sm text-muted-foreground mb-4 flex-1">
                            High-quality {product.name.toLowerCase()} for reliable performance
                          </p>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary/20">
                            <span className="font-bold text-lg bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">{product.price}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-secondary/20 text-secondary font-bold transition-all duration-300 hover:scale-110"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              View Details →
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No products found matching your filters</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedType('all')
                      setSearchQuery('')
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
