import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/supabase/send-notification'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, status } = body

    // Get admin email from environment or context
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kbc.co.za'

    // Send notification email
    await sendNotificationEmail({
      customerEmail: adminEmail,
      adminEmail: adminEmail,
      action: action,
      status: status,
      message: status === 'success' 
        ? `${action} was performed successfully at ${new Date().toLocaleTimeString()}`
        : `${action} failed. Please check the system logs.`,
      details: {
        'Timestamp': new Date().toISOString(),
        'Action': action,
        'Status': status.toUpperCase(),
      }
    })

    console.log('[v0] Settings notification email sent:', { action, status })
    return NextResponse.json({ success: true, message: 'Notification sent' })
  } catch (error) {
    console.error('[v0] Settings notification error:', error)
    return NextResponse.json({ success: false, message: 'Notification failed' }, { status: 500 })
  }
}
