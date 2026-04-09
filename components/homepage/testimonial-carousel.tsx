'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Testimonial {
  name: string
  company: string
  content: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: 'John Smith',
    company: 'Truck Fleet Services',
    content: 'KBC provides consistently high-quality brake components at competitive prices. Their technical support team is exceptional.',
    rating: 5,
  },
  {
    name: 'Sarah Dlamini',
    company: 'Auto Repair Network',
    content: 'We have been sourcing from KBC for 5 years. Reliability and fast delivery are unmatched in our region.',
    rating: 5,
  },
  {
    name: 'Ahmed Hassan',
    company: 'Heavy Duty Components Ltd',
    content: 'The clutch plates from KBC exceed our expectations. Same-day service saved us during critical repairs.',
    rating: 5,
  },
]

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((current + 1) % testimonials.length)
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length)

  const testimonial = testimonials[current]

  return (
    <div className="relative w-full">
      <div className="p-8 md:p-12 bg-gradient-to-br from-card to-card/50 rounded-xl border border-primary/20 shadow-xl shadow-primary/10 backdrop-blur-sm hover:border-secondary/40 transition-all duration-300 animate-fade-in-up">
        <div className="flex gap-1 mb-4 animate-pulse">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
          ))}
        </div>
        <p className="text-lg md:text-xl mb-6 italic font-medium text-foreground">{testimonial.content}</p>
        <div className="flex items-center justify-between pt-6 border-t border-primary/20">
          <div className="flex-1">
            <p className="font-bold text-lg text-foreground">{testimonial.name}</p>
            <p className="text-sm text-muted-foreground font-medium">{testimonial.company}</p>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              aria-label="Previous testimonial"
              className="border-primary/30 hover:bg-secondary/20 hover:border-secondary/50 transition-all duration-300 bg-transparent"
            >
              <ChevronLeft className="w-4 h-4 text-secondary" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              aria-label="Next testimonial"
              className="border-primary/30 hover:bg-secondary/20 hover:border-secondary/50 transition-all duration-300 bg-transparent"
            >
              <ChevronRight className="w-4 h-4 text-secondary" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === current
                ? 'bg-primary w-8'
                : 'bg-border w-2 hover:bg-primary/50'
            }`}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
