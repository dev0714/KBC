'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const enquiries = [
  {
    id: 'ENQ-001',
    productName: 'Brake Shoe Set HD',
    customerName: 'John Smith',
    company: 'Fleet Services Ltd',
    email: 'john@fleet.com',
    phone: '+27 11 123 4567',
    quantity: '100',
    date: '2024-01-22',
    status: 'new',
  },
  {
    id: 'ENQ-002',
    productName: 'Clutch Plate Assembly',
    customerName: 'Sarah Dlamini',
    company: 'Auto Repair Network',
    email: 'sarah@autorepair.com',
    phone: '+27 11 234 5678',
    quantity: '50',
    date: '2024-01-21',
    status: 'responded',
  },
  {
    id: 'ENQ-003',
    productName: 'Bearing Kit',
    customerName: 'Ahmed Hassan',
    company: 'Heavy Duty Components',
    email: 'ahmed@hdcomp.com',
    phone: '+27 11 345 6789',
    quantity: '200',
    date: '2024-01-20',
    status: 'responded',
  },
]

export default function EnquiriesPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filteredEnquiries = enquiries.filter(
    (e) => selectedFilter === 'all' || e.status === selectedFilter
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Product Enquiries</h1>
            <p className="text-muted-foreground">Manage customer enquiries and requests</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8">
            {[
              { value: 'all', label: 'All Enquiries' },
              { value: 'new', label: 'New' },
              { value: 'responded', label: 'Responded' },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? 'default' : 'outline'}
                onClick={() => setSelectedFilter(filter.value)}
                size="sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Enquiries List */}
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold">{enquiry.productName}</h3>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          enquiry.status === 'new'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {enquiry.status === 'new' ? 'New' : 'Responded'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Enquiry ID: {enquiry.id}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{enquiry.date}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{enquiry.customerName}</p>
                    <p className="text-sm text-muted-foreground">{enquiry.company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contact Details</p>
                    <p className="text-sm font-medium">{enquiry.email}</p>
                    <p className="text-sm font-medium">{enquiry.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Product</p>
                    <p className="font-medium">{enquiry.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Requested Quantity</p>
                    <p className="font-medium">{enquiry.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    {enquiry.status === 'responded' && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Quote Sent</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {enquiry.status === 'new' && (
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                      Send Quote
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredEnquiries.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground mb-4">No enquiries found</p>
              <Button
                variant="outline"
                onClick={() => setSelectedFilter('all')}
              >
                View All Enquiries
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
