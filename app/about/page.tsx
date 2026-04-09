'use client'

import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Award, Users, Zap, Globe } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="mb-4">About KBC Brake & Clutch</h1>
            <p className="text-xl text-muted-foreground">
              Over 25 years of excellence in manufacturing and supplying premium automotive components
            </p>
          </div>
        </section>

        {/* Company History */}
        <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1]">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="mb-8 text-white">Our Story</h2>
                <div className="space-y-6 text-base md:text-lg text-white/80 leading-relaxed">
                  <p>
                    KBC has been manufacturing high quality replacement brake and clutch components in South Africa since 2001. 
                    We have tried and tested products at very competitive prices, together with the expertise of a highly skilled team with many years of experience.
                  </p>
                  <p>
                    Since then, KBC has developed into a well-established brand nationally as well as in neighbouring countries. 
                    The KBC range exceeds over 500 applications. We endeavour to provide a quality product at very affordable prices.
                  </p>
                  <p>
                    We strive to take care of your brake and clutch needs for both the light and heavy vehicle industries.
                    Our products are well renowned and meet international standards. At KBC we take pride in ensuring that our customers get the highest quality components at a competitive price.
                  </p>
                </div>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg border border-accent/20">
                <Image 
                  src="/images/about-manufacturing-facility.jpg" 
                  alt="KBC Manufacturing Facility" 
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Heavy-Duty Expertise */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg border border-accent/20 order-2 md:order-1">
                <Image 
                  src="/images/heavy-vehicle-parts.jpg" 
                  alt="Heavy-Duty Components" 
                  fill
                  className="object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">Heavy-Duty Expertise</h3>
                <div className="space-y-4 text-base md:text-lg text-white/80 leading-relaxed">
                  <p>
                    We stock quality aftermarket heavy-duty clutch replacement kits. We have tried and tested quality products, together with the expertise of a highly skilled heavy-duty team with many years of experience.
                  </p>
                  <p>
                    Our products include Heavy-Duty Clutch Kits, Flywheels, Concentric Slave Cylinders as well as Release Bearings.
                  </p>
                  <p>
                    The rest of our extensive range also includes light-duty, heavy-duty as well as off road vehicles.
                    Our ever-increasing range of European, American and Japanese models will ensure that you will receive a high quality product at very affordable price.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto">
            <h2 className="text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Award,
                  title: 'Quality',
                  description: 'ISO certified manufacturing with rigorous quality control',
                },
                {
                  icon: Users,
                  title: 'Customer Focus',
                  description: 'Dedicated support team committed to your success',
                },
                {
                  icon: Zap,
                  title: 'Innovation',
                  description: 'Continuous improvement and modern manufacturing techniques',
                },
                {
                  icon: Globe,
                  title: 'Reliability',
                  description: 'Trusted supply chain ensuring consistent delivery',
                },
              ].map((value) => {
                const Icon = value.icon
                return (
                  <div key={value.title} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="font-bold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Key Stats */}
        <section className="relative py-16 px-4 overflow-hidden bg-background">
          {/* Brake disc pattern background */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' strokeWidth='2'%3E%3Ccircle cx='100' cy='100' r='80'/%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cline x1='100' y1='20' x2='100' y2='50'/%3E%3Cline x1='156.6' y1='43.4' x2='135.4' y2='64.6'/%3E%3Cline x1='180' y1='100' x2='150' y2='100'/%3E%3Cline x1='156.6' y1='156.6' x2='135.4' y2='135.4'/%3E%3Cline x1='100' y1='180' x2='100' y2='150'/%3E%3Cline x1='43.4' y1='156.6' x2='64.6' y2='135.4'/%3E%3Cline x1='20' y1='100' x2='50' y2='100'/%3E%3Cline x1='43.4' y1='43.4' x2='64.6' y2='64.6'/%3E%3Ccircle cx='100' cy='100' r='12' fill='%23ef4444'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: 'repeat'}}></div>

          <div className="container mx-auto relative z-10">
            <h2 className="text-center mb-12">By The Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {[
                { number: '25+', label: 'Years in Business' },
                { number: '4000+', label: 'Active Products' },
                { number: '650+', label: 'SA Customers' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-4xl font-bold text-primary mb-2">{stat.number}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="mb-6">Ready to Partner With Us?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of businesses across Southern Africa that trust KBC for their automotive
              component needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/products">View Products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
