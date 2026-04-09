import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  action: string
  status: 'success' | 'failed'
  details?: Record<string, any>
}

// Initialize nodemailer transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

// Format details for email body
function formatDetails(details?: Record<string, any>): string {
  if (!details || Object.keys(details).length === 0) {
    return ''
  }
  
  return Object.entries(details)
    .map(([key, value]) => `<tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>${key}:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${value}</td></tr>`)
    .join('')
}

// Create HTML email template
function createEmailTemplate(
  action: string,
  status: 'success' | 'failed',
  details?: Record<string, any>
): string {
  const isSuccess = status === 'success'
  const statusColor = isSuccess ? '#22c55e' : '#ef4444'
  const statusText = isSuccess ? 'SUCCESS' : 'FAILED'
  const companyName = process.env.COMPANY_NAME || 'KBC'
  const timestamp = new Date().toLocaleString()

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #0056a1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 4px; background-color: ${statusColor}; color: white; font-weight: bold; margin: 10px 0; }
          .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName} - Operation Notification</h1>
          </div>
          <div class="content">
            <h2>Operation: ${action}</h2>
            <p><span class="status">${statusText}</span></p>
            
            <table class="details-table">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${companyName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${statusText}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Timestamp:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${timestamp}</td></tr>
              ${formatDetails(details)}
            </table>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you did not initiate this operation or have any questions, please contact support.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Send email notification for backend operations
 * @param options Email configuration options
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendOperationEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('[v0] Email configuration missing. Skipping email notification.')
      return false
    }

    const transporter = getTransporter()
    const subject = options.status === 'success' ? 'Operation Successful' : 'Operation Failed'
    const htmlContent = createEmailTemplate(options.action, options.status, options.details)

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: `[${options.status.toUpperCase()}] ${subject}`,
      html: htmlContent,
    })

    console.log(`[v0] Email sent successfully to ${options.to} for action: ${options.action}`)
    return true
  } catch (error) {
    console.error(`[v0] Error sending email: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}
