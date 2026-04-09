import { Loader2 } from 'lucide-react'

export default function PaymentCallbackLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#000034] via-[#002463] to-[#0056a1] items-center justify-center px-4">
      <div className="bg-slate-400/10 border border-slate-400/20 rounded-lg p-8 max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
        <p className="text-slate-400">Please wait while we verify your payment...</p>
      </div>
    </div>
  )
}
