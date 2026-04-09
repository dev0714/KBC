'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, Search, ShoppingCart, Heart, Filter } from 'lucide-react'

const products = [
  { id: 1, name: 'Brake Shoe Set HD', category: 'brake', type: 'Heavy Duty', price: 1200, sku: 'BS-HD-001', stock: 45, image: 'Brake Shoes' },
  { id: 2, name: 'Brake Pad Kit', category: 'brake', type: 'Light Duty', price: 850, sku: 'BP-LD-001', stock: 67, image: 'Brake Pads' },
  { id: 3, name: 'Clutch Plate Assembly', category: 'clutch', type: 'Heavy Duty', price: 2450, sku: 'CP-HD-001', stock: 28, image: 'Clutch Plates' },
  { id: 4, name: 'Pressure Plate', category: 'clutch', type: 'Light Duty', price: 1650, sku: 'PP-LD-001', stock: 34, image: 'Pressure Plates' },
  { id: 5, name: 'Brake Disc Set', category: 'brake', type: 'Heavy Duty', price: 1895, sku: 'BD-HD-001', stock: 52, image: 'Brake Discs' },
  { id: 6, name: 'Bearing Kit', category: 'bearings', type: 'Light Duty', price: 745, sku: 'BK-LD-001', stock: 89, image: 'Bearings' },
  { id: 7, name: 'Clutch Kit Complete', category: 'clutch', type: 'Heavy Duty', price: 3200, sku: 'CK-HD-001', stock: 15, image: 'Clutch Kits' },
  { id: 8, name: 'Hydraulic Cylinder', category: 'bearings', type: 'Heavy Duty', price: 1420, sku: 'HC-HD-001', stock: 23, image: 'Hydraulic' },
  { id: 9, name: 'Brake Lining', category: 'brake', type: 'Light Duty', price: 620, sku: 'BL-LD-001', stock: 101, image: 'Brake Linings' },
]

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'brake', label: 'Brake Components' },
  { value: 'clutch', label: 'Clutch Components' },
  { value: 'bearings', label: 'Hydraulic & Bearings' },
]

const types = [
  { value: 'all', label: 'All Types' },
  { value: 'Light Duty', label: 'Light Duty' },
  { value: 'Heavy Duty', label: 'Heavy Duty' },
]

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesType = selectedType === 'all' || product.type === selectedType
      return matchesSearch && matchesCategory && matchesType
    })
  }, [searchQuery, selectedCategory, selectedType])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-12 px-4 bg-gradient-to-br from-primary/20 via-secondary/10 to-background border-b border-primary/20 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
          <div className="relative container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Product Catalog</h1>
            <p className="text-lg text-muted-foreground">Browse and purchase from our complete range of brake and clutch components</p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="space-y-6 sticky top-24">
                {/* Search */}
                <div className="bg-card border border-primary/20 rounded-lg p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-primary/30 focus:border-secondary"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="bg-card border border-primary/20 rounded-lg p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Category
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat.value} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="category"
                          value={cat.value}
                          checked={selectedCategory === cat.value}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-4 h-4 cursor-pointer accent-secondary"
                        />
                        <span className="text-sm group-hover:text-secondary transition-colors">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div className="bg-card border border-primary/20 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Type</h3>
                  <div className="space-y-2">
                    {types.map((type) => (
                      <label key={type.value} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="type"
                          value={type.value}
                          checked={selectedType === type.value}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="w-4 h-4 cursor-pointer accent-secondary"
                        />
                        <span className="text-sm group-hover:text-secondary transition-colors">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || selectedCategory !== 'all' || selectedType !== 'all') && (
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 hover:border-secondary/50 bg-transparent"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setSelectedType('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary/20">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product, idx) => (
                    <Link
                      key={product.id}
                      href={`/customer/catalog/${product.id}`}
                      className="group block"
                    >
                      <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl overflow-hidden hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-1 h-full animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                        {/* Image Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors relative">
                          <span className="text-4xl opacity-50 group-hover:opacity-70 transition-opacity">{product.image}</span>
                          <button className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-secondary/20 transition-colors opacity-0 group-hover:opacity-100">
                            <Heart className="w-5 h-5 text-secondary" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <p className="text-xs text-secondary font-bold mb-1">{product.sku}</p>
                          <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-secondary transition-colors">{product.name}</h3>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-2xl font-bold text-foreground">R{product.price.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{product.type}</p>
                            </div>
                          </div>

                          {/* Stock Status */}
                          <div className="mb-4">
                            {product.stock > 20 ? (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/50">
                                In Stock ({product.stock})
                              </span>
                            ) : product.stock > 0 ? (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/50">
                                Low Stock ({product.stock})
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/50">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          <Button className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-bold shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all gap-2" disabled={product.stock === 0}>
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-4">No products found matching your filters</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setSelectedType('all')
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
