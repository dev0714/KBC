import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { TestimonialCarousel } from '@/components/homepage/testimonial-carousel'
import { ServicesGrid } from '@/components/homepage/services-grid'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PortalButton } from '@/components/homepage/portal-button'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section - Minimal reui.io style */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/hero-workshop.jpg)' }}>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/95"></div>
          
          <div className="relative container mx-auto px-4 max-w-4xl">
            <div className="text-center space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full border border-accent/30 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="text-accent font-medium">Trusted since 1997</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Value Driven Brake And Clutch Parts
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Quality automotive components for Southern Africa. Manufacturers & wholesalers with 27 years of manufacturing excellence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white font-semibold">
                  <Link href="/products" className="flex items-center gap-2">
                    Browse Products
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border border-accent/30 text-accent hover:bg-accent/5 bg-transparent">
                  <Link href="/contact">Get a Quote!</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-20 border-y border-accent/10 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '650+', label: 'SA Customers' },
                { value: '27+', label: 'Years Active' },
                { value: '287', label: 'SKUs' },
                { value: '100K+', label: 'Orders Shipped' }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-accent mb-2">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products - Card grid */}
        <section className="py-20 md:py-28 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Featured Products</h2>
              <p className="text-lg text-muted-foreground">
                Explore our comprehensive range of brake and clutch components
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Brake Shoes', desc: 'Heavy duty brake shoes for all vehicle types', image: '/images/product-brake-shoes.jpg' },
                { name: 'Brake Pads', desc: 'Premium quality friction pads with superior performance', image: '/images/product-brake-pads.jpg' },
                { name: 'Clutch Plates', desc: 'High performance clutch plate sets for demanding applications', image: '/images/product-clutch-plates.jpg' },
              ].map((product) => (
                <div 
                  key={product.name} 
                  className="overflow-hidden border border-accent/10 rounded-lg hover:border-accent/30 transition-all hover:bg-card/50 group"
                >
                  {/* Product Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-card/50">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-foreground mb-2">{product.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{product.desc}</p>
                    <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent hover:bg-accent/10 p-0 h-auto font-semibold">
                      <Link href="/products" className="flex items-center gap-1">
                        Learn more
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose KBC - Features */}
        <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] border-y border-accent/10">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">Why Choose KBC</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Quality Assured', desc: 'ISO certified production processes with rigorous quality control' },
                { title: 'Fast Delivery', desc: 'Same-day service available for most orders' },
                { title: 'Competitive Pricing', desc: 'Best value in the market without compromising quality' },
                { title: 'Expert Support', desc: 'Dedicated technical team ready to assist you' },
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-4 p-6 border-2 border-white/20 rounded-lg hover:bg-white/10 transition-all group hover:border-white/40 bg-white/5">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-white/80">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden bg-background">
          {/* Brake disc pattern background */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' strokeWidth='2'%3E%3Ccircle cx='100' cy='100' r='80'/%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cline x1='100' y1='20' x2='100' y2='50'/%3E%3Cline x1='156.6' y1='43.4' x2='135.4' y2='64.6'/%3E%3Cline x1='180' y1='100' x2='150' y2='100'/%3E%3Cline x1='156.6' y1='156.6' x2='135.4' y2='135.4'/%3E%3Cline x1='100' y1='180' x2='100' y2='150'/%3E%3Cline x1='43.4' y1='156.6' x2='64.6' y2='135.4'/%3E%3Cline x1='20' y1='100' x2='50' y2='100'/%3E%3Cline x1='43.4' y1='43.4' x2='64.6' y2='64.6'/%3E%3Ccircle cx='100' cy='100' r='12' fill='%23ef4444'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: 'repeat'}}></div>

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Services</h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive solutions for all your brake and clutch needs
              </p>
            </div>
            <ServicesGrid />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] border-y border-accent/10">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What Our Customers Say</h2>
              <p className="text-lg text-white/80">
                Trusted by leading automotive businesses across Southern Africa
              </p>
            </div>
            <TestimonialCarousel />
          </div>
        </section>

        {/* Customer Portal CTA */}
        <section className="py-20 md:py-28 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="p-8 md:p-12 border border-accent/20 rounded-xl bg-card/50 text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full border border-accent/30 text-sm">
                <span className="text-accent font-medium">For Existing Customers</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Access Your Customer Portal</h2>
              <p className="text-lg text-muted-foreground">
                Manage orders, track shipments, view quotes, and access your account documents
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <PortalButton />
                <Button asChild variant="outline" size="lg" className="border border-accent/30 text-accent hover:bg-accent/5 bg-transparent">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 px-4 bg-card/30 border-t border-accent/10">
          <div className="container mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">
              Contact our team for product inquiries, custom orders, or technical support
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white font-semibold gap-2">
              <Link href="/contact">
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
