'use client'

import { PortalError } from '@/components/portal/states'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalError error={error} reset={reset} backHref="/dashboard" backLabel="Back to overview" />
}
