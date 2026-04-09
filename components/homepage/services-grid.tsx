'use client'

import Image from 'next/image'
import { Wrench, Zap, Shield, Headphones } from 'lucide-react'

const services = [
  {
    icon: Wrench,
    title: 'Manufacturing',
    description: 'State-of-the-art production facilities with ISO certifications and quality control standards',
    image: '/images/service-manufacturing.jpg',
  },
  {
    icon: Zap,
    title: 'Wholesale Distribution',
    description: 'Fast and reliable distribution across Southern Africa with same-day service options',
    image: '/images/service-distribution.jpg',
  },
  {
    icon: Shield,
    title: 'Custom Solutions',
    description: 'Expert identification and custom manufacturing for specific vehicle applications',
    image: '/images/service-custom.jpg',
  },
  {
    icon: Headphones,
    title: 'Technical Support',
    description: 'Dedicated support team for technical specifications, installation guides, and troubleshooting',
    image: '/images/service-support.jpg',
  },
]

export function ServicesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {services.map((service) => {
        const Icon = service.icon
        return (
          <div
            key={service.title}
            className="overflow-hidden rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
          >
            {/* Image */}
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={service.image || "/placeholder.svg"}
                alt={service.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="mb-4 inline-flex p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition">
                <Icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
