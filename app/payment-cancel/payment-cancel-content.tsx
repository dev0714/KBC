'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-background to-blue-900 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full bg-card/95 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-foreground">Payment Cancelled</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your payment was cancelled and no charges were made
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-accent/20 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              If you experienced any issues, please contact our support team.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard?refresh=true">Return to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard?refresh=true">Try Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
