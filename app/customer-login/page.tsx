import { redirect } from 'next/navigation'

// The old customer login screen never checked a password; customers and
// admins both sign in at /login.
export default function CustomerLoginPage() {
  redirect('/login')
}
