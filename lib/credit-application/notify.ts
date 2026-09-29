import type { CreditApplicationInput, DocumentDeclaration } from './schema'
import { DOCUMENT_KINDS } from './schema'

// Emails go through the Supabase `send_email` edge function, the same path
// the PayFast payment-link emails use.

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const row = (label: string, value: unknown) =>
  value === '' || value == null
    ? ''
    : `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#475569;width:40%">${esc(label)}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#0f172a">${esc(value)}</td></tr>`

function shell(title: string, inner: string) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:640px;margin:24px auto;background:#fff;border-radius:10px;overflow:hidden">
<div style="background:linear-gradient(90deg,#000034,#0056a1);color:#fff;padding:20px 24px">
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">KBC Brake &amp; Clutch · West Point Trading 55 CC</div>
<div style="font-size:22px;font-weight:bold;margin-top:6px">${esc(title)}</div></div>
<div style="padding:20px 24px">${inner}</div>
<div style="background:#f8fafc;color:#64748b;font-size:12px;padding:14px 24px">Stephenson Str. (Cnr. Newton), Wemmer, Johannesburg · Tel 011 493 1336 · kbc1@telkomsa.net</div>
</div></body></html>`
}

export function adminEmailHtml(
  reference: string,
  a: CreditApplicationInput,
  docs: DocumentDeclaration[],
  adminUrl: string,
) {
  const kindLabel = (k: string) => DOCUMENT_KINDS.find((d) => d.id === k)?.label ?? k
  return shell(
    `New credit application ${reference}`,
    `<p style="color:#0f172a">A new credit application was submitted online.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">
${row('Reference', reference)}
${row('Registered name', a.registeredName)}
${row('Trading name', a.tradingName)}
${row('Entity type', a.entityType)}
${row('Registration no.', a.registrationNumber)}
${row('VAT no.', a.vatNumber)}
${row('Credit limit requested', a.creditLimit ? `R ${a.creditLimit}` : '')}
${row('Buyer contact', `${a.buyerContact.name} · ${a.buyerContact.phone} · ${a.buyerContact.email}`)}
${row('Accounts contact', `${a.accountsContact.name} · ${a.accountsContact.phone} · ${a.accountsContact.email}`)}
${row('Owners / directors', a.directors.map((d) => d.fullName).join(', '))}
${row('Signed by', `${a.signatoryName} (${a.signatoryCapacity}) on ${a.signedDate}`)}
${row('Sales representative', a.salesRep)}
${row('Documents', docs.length ? docs.map((d) => kindLabel(d.kind)).join('; ') : 'None uploaded')}
</table>
<p style="margin-top:18px"><a href="${esc(adminUrl)}" style="background:#dc2626;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Review in admin panel</a></p>`,
  )
}

export function applicantEmailHtml(reference: string, a: CreditApplicationInput) {
  return shell(
    'We received your credit application',
    `<p style="color:#0f172a">Dear ${esc(a.buyerContact.name || a.signatoryName)},</p>
<p style="color:#0f172a">Thank you for applying for a credit account with KBC Brake &amp; Clutch (West Point Trading 55 CC).
Your application for <strong>${esc(a.registeredName)}</strong> has been received.</p>
<p style="color:#0f172a">Your reference number is <strong>${esc(reference)}</strong>. Please quote it if you contact us about your application.</p>
<p style="color:#0f172a">Our accounts team will review your application and the supporting documents, and will be in touch.
If any documents are still outstanding, you can email them to kbc1@telkomsa.net with your reference number in the subject line.</p>`,
  )
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  const from =
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.ADMIN_EMAIL ||
    'kbc@notification.leadsync.co.za'
  try {
    const res = await fetch(`${url}/functions/v1/send_email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key },
      body: JSON.stringify({ to, from, subject, html }),
    })
    if (!res.ok) console.error('[credit-application] email failed', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('[credit-application] email error', err)
    return false
  }
}

export function creditTeamEmail() {
  return process.env.CREDIT_APPLICATION_EMAIL || process.env.ADMIN_EMAIL || 'kbc1@telkomsa.net'
}
