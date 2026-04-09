'use client'

import React from "react"

import { useState } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setSubmitted(true)
      setFormData({ name: '', company: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 3000)
      setLoading(false)
    }, 500)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center min-h-[450px]">
            {/* Image Side */}
            <div className="relative h-[350px] md:h-[450px] overflow-hidden order-2 md:order-2">
              <Image 
                src="/images/warehouse-logistics.jpg" 
                alt="KBC Facility" 
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent"></div>
            </div>
            
            {/* Content Side */}
            <div className="px-6 md:px-12 py-12 md:py-0 order-1 md:order-1">
              <h1 className="mb-4 animate-fade-in-down text-4xl md:text-5xl font-bold">Contact Us</h1>
              <p className="text-xl text-muted-foreground animate-fade-in-up">
                Get in touch with our team for inquiries, support, or partnership opportunities
              </p>
            </div>
          </div>
        </section>

        <div className="w-full bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-6">
                <div className="animate-fade-in-up">
                  <h3 className="font-bold text-3xl mb-2 text-white">Get In Touch</h3>
                  <p className="text-white/80">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 group hover:shadow-lg hover:shadow-white/20 animate-fade-in-up cursor-pointer" style={{ animationDelay: '0.1s' }}>
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white shadow-lg shadow-white/30 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1 text-white">Address</p>
                    <p className="text-sm text-white/80">
                      6 Stephenson Street, Wemmer
                      <br />
                      Johannesburg, South Africa
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 group hover:shadow-lg hover:shadow-white/20 animate-fade-in-up cursor-pointer" style={{ animationDelay: '0.2s' }}>
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white shadow-lg shadow-white/30 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1 text-white">Phone</p>
                    <a href="tel:+27114931336" className="text-sm text-white hover:underline block">+27 11 493 1336</a>
                    <a href="tel:+27110220987" className="text-sm text-white hover:underline block">+27 11 022 0987</a>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 group hover:shadow-lg hover:shadow-white/20 animate-fade-in-up cursor-pointer" style={{ animationDelay: '0.3s' }}>
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white shadow-lg shadow-white/30 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1 text-white">Email</p>
                    <a href="mailto:kbc1@telkomsa.net" className="text-sm text-white hover:underline block">kbc1@telkomsa.net</a>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 group hover:shadow-lg hover:shadow-white/20 animate-fade-in-up cursor-pointer" style={{ animationDelay: '0.4s' }}>
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white shadow-lg shadow-white/30 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1 text-white">Business Hours</p>
                    <p className="text-sm text-white/80">Mon - Fri: 8:00 AM - 5:00 PM<br/>Sat: 8:00 AM - 1:00 PM</p>
                  </div>
                </div>

                <a href="https://wa.me/27114931336" target="_blank" rel="noopener noreferrer" className="flex gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all duration-300 group hover:shadow-lg hover:shadow-white/20 animate-fade-in-up cursor-pointer" style={{ animationDelay: '0.5s' }}>
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white shadow-lg shadow-white/30 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1 text-white">WhatsApp</p>
                    <p className="text-sm text-white/80">+27 11 493 1336</p>
                  </div>
                </a>
              </div>

              {/* Contact Form */}
              <div className="bg-white/10 border border-white/20 rounded-xl p-8 shadow-xl shadow-white/10 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="font-bold text-2xl mb-6 text-white">Send us a Message</h3>

                {submitted && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-400/50 text-green-100 font-semibold animate-fade-in-up">
                    Thank you! Your message has been sent successfully. We'll get back to you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Smith"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-sm font-medium mb-2 block">
                        Company
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+27 11 000 0000"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium mb-2 block">
                      Subject *
                    </Label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select a subject...</option>
                      <option value="product">Product Inquiry</option>
                      <option value="quote">Quote Request</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium mb-2 block">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message here..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
