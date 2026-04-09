'use client'

import { Suspense } from 'react'
import PaymentCancelContent from './payment-cancel-content'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-background to-blue-900 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foreground">Processing...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentCancelContent />
    </Suspense>
  )
}
