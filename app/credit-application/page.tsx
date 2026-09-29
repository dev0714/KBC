import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'
import { CreditApplicationForm } from '@/components/credit-application/credit-application-form'
import { Clock, FileCheck2, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Credit Application | KBC Brake & Clutch',
  description:
    'Apply online for a trade credit account with KBC Brake & Clutch (West Point Trading 55 CC). Takes about 10 minutes.',
  openGraph: {
    title: 'Apply for a KBC Brake & Clutch credit account',
    description: 'Complete and sign the West Point Trading 55 CC credit application online.',
  },
}

export default function CreditApplicationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-primary/10 to-background px-4 py-14">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              West Point Trading 55 CC t/a KBC Brake &amp; Clutch
            </p>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Credit Application</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Open a trade account online. Complete the form, upload your documents and sign on screen — no printing
              or scanning needed.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {[
                { icon: Clock, title: 'About 10 minutes', text: 'Your progress is saved as you go' },
                { icon: FileCheck2, title: 'Have these ready', text: 'CIPC docs, VAT certificate, bank letter, owner IDs' },
                { icon: ShieldCheck, title: 'Private & secure', text: 'Documents are stored privately for our accounts team' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] px-4 py-14">
          <Suspense fallback={<div className="py-24" />}>
            <CreditApplicationForm />
          </Suspense>
        </section>
      </main>
      <Footer />
    </div>
  )
}
