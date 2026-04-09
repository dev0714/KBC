'use client'

import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import Image from 'next/image'

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Video Section */}
        <section className="relative py-20 md:py-28 px-4 bg-background overflow-hidden">
          {/* Brake disc pattern background */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ef4444' strokeWidth='2'%3E%3Ccircle cx='100' cy='100' r='80'/%3E%3Ccircle cx='100' cy='100' r='50'/%3E%3Cline x1='100' y1='20' x2='100' y2='50'/%3E%3Cline x1='156.6' y1='43.4' x2='135.4' y2='64.6'/%3E%3Cline x1='180' y1='100' x2='150' y2='100'/%3E%3Cline x1='156.6' y1='156.6' x2='135.4' y2='135.4'/%3E%3Cline x1='100' y1='180' x2='100' y2='150'/%3E%3Cline x1='43.4' y1='156.6' x2='64.6' y2='135.4'/%3E%3Cline x1='20' y1='100' x2='50' y2='100'/%3E%3Cline x1='43.4' y1='43.4' x2='64.6' y2='64.6'/%3E%3Ccircle cx='100' cy='100' r='12' fill='%23ef4444'/%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: 'repeat'}}></div>

          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">KBC Promotional Video</h2>
              <p className="text-lg text-muted-foreground">Watch our journey and discover what makes us different</p>
            </div>
            
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-accent/20 bg-card/50">
              <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                <video
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  poster="/images/hero-background.jpg"
                >
                  <source src="https://vrvwlcffvojoelrbwnej.supabase.co/storage/v1/object/public/Video/KBC_Promo_Video_New.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-lg bg-accent/5 border border-accent/20 text-center">
              <p className="text-sm text-muted-foreground">
                High-quality clutch and brake components trusted by businesses worldwide
              </p>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-8 md:py-12 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-3">Our Services</h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Clutch Assessment and Repair Service
            </p>
          </div>
        </section>

        {/* Parts Identification Service */}
        <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] border-y border-accent/10">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-accent/20">
                <Image 
                  src="/images/service-parts-identification.jpg"
                  alt="Parts Identification Service" 
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/30 pointer-events-none"></div>
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Parts Identification Service</h2>
                <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
                  <p>
                    We offer a unique service to our customers by identifying brake and clutch parts for them, simply by sending us the pictures and dimensions.
                  </p>
                  <p>
                    Our experienced team can quickly analyze your parts and provide accurate identification to ensure you get exactly what you need for your vehicle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Advice & Support Service */}
        <section className="py-20 md:py-28 px-4 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Expert Advice & Support</h2>
                <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
                  <p>
                    Our other services include providing our customers with expert advice with regards to fitment of our products, care and any other information the customers require.
                  </p>
                  <p>
                    Our knowledgeable team is committed to helping you select the right components and ensuring proper installation and maintenance for optimal performance.
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2 relative w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-accent/20">
                <Image 
                  src="/images/service-expert-advice.jpg"
                  alt="Expert Advice & Support Service" 
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/30 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
