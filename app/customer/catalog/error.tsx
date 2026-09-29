'use client'

import { PortalError } from '@/components/portal/states'

export default function CatalogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PortalError error={error} reset={reset} backHref="/dashboard?tab=shop" backLabel="Back to catalog" />
}
