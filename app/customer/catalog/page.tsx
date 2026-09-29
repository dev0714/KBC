import { redirect } from 'next/navigation'

// The live catalog is the portal's Shop tab.
export default function CatalogPage() {
  redirect('/dashboard?tab=shop')
}
