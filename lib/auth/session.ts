import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export interface SessionPayload {
  id: string
  email: string
  role: string
  business_id?: string | null
  status?: string
}

/**
 * Reads and verifies the kbc_session JWT from cookies.
 * Returns the decoded payload, or null if missing/invalid.
 *
 * NOTE: This app does not use Supabase Auth — authorization is enforced
 * here in the API layer because the database is accessed with the service
 * role key (which bypasses RLS). Every route that touches a protected table
 * MUST gate on getSession()/requireAdmin().
 */
export async function getSession(): Promise<SessionPayload | null> {
  if (!process.env.JWT_SECRET) {
    console.error('[auth] JWT_SECRET not configured')
    return null
  }

  const token = (await cookies()).get('kbc_session')?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Returns the session only if the user has the admin role, else null. */
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}
