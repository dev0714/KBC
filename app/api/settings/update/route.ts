import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/supabase/send-notification'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, status, settings } = body

    // Get admin email from environment or context
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kbc.co.za'

    // Send notification email
    await sendNotificationEmail({
      customerEmail: adminEmail,
      adminEmail: adminEmail,
      action: action,
      status: status,
      message: status === 'success' 
        ? `${action} was updated successfully at ${new Date().toLocaleTimeString()}`
        : `${action} update failed. Please check the system logs.`,
      details: {
        'Timestamp': new Date().toISOString(),
        'Action': action,
        'Status': status.toUpperCase(),
        'Company': settings?.companyName || 'N/A',
      }
    })

    console.log('[v0] Settings updated:', { action, status })
    return NextResponse.json({ success: true, message: 'Settings updated and notification sent' })
  } catch (error) {
    console.error('[v0] Settings update error:', error)
    return NextResponse.json({ success: false, message: 'Settings update failed' }, { status: 500 })
  }
}
