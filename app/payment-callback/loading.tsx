import { PortalScreen } from '@/components/portal/shell'
import { ResultCard } from '@/components/portal/result-card'

export default function PaymentCallbackLoading() {
  return (
    <PortalScreen>
      <ResultCard tone="loading" title="Checking your payment…">
        <p>Please wait while we confirm the result with PayFast.</p>
      </ResultCard>
    </PortalScreen>
  )
}
