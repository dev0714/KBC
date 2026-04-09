/**
 * Sends a notification email via Supabase Edge Function
 * Call this after any successful or failed operation
 */

interface NotificationPayload {
  customerEmail: string
  adminEmail?: string
  action: string
  status: 'success' | 'failed'
  message: string
  details?: Record<string, any>
}

export async function sendNotificationEmail(payload: NotificationPayload): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[v0] Missing Supabase credentials for email notification')
      return
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-notification-email`

    console.log('[v0] Sending notification email:', {
      action: payload.action,
      status: payload.status,
      to: payload.customerEmail,
    })

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        customerEmail: payload.customerEmail,
        adminEmail: payload.adminEmail,
        action: payload.action,
        status: payload.status,
        message: payload.message,
        details: payload.details,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      console.error('[v0] Email notification failed:', response.status, await response.text())
      return
    }

    const result = await response.json()
    console.log('[v0] Email notification sent successfully:', result)
  } catch (error) {
    console.error('[v0] Error sending notification email:', error)
    // Don't throw - notifications are non-critical
  }
}
