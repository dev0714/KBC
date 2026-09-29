import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  type CreditApplicationInput,
  type DocumentDeclaration,
  sanitize,
  validateAll,
  validateDocuments,
} from '@/lib/credit-application/schema'
import { TERMS_VERSION } from '@/lib/credit-application/terms'
import { adminEmailHtml, applicantEmailHtml, creditTeamEmail, sendEmail } from '@/lib/credit-application/notify'

// Public endpoint: anyone with the link can apply. The row is written with the
// service role (RLS blocks the anon key); documents are uploaded straight from
// the browser to the private bucket using one-time signed upload URLs, so
// large files never pass through this function.

const BUCKET = 'credit-applications'
const MAX_PER_IP_PER_HOUR = 5

function makeReference() {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand = Array.from(randomBytes(4), (b) => alphabet[b % alphabet.length]).join('')
  return `CA-${ymd}-${rand}`
}

const safeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(-80) || 'file'

export async function POST(request: NextRequest) {
  let body: { application?: CreditApplicationInput; documents?: DocumentDeclaration[]; website?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot: real users never see or fill this field.
  if (body.website) return NextResponse.json({ reference: makeReference(), uploads: [] })

  if (!body.application) return NextResponse.json({ error: 'Missing application' }, { status: 400 })
  const application = sanitize(body.application)
  const errors = validateAll(application)
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Please fix the highlighted fields', fieldErrors: errors }, { status: 422 })
  }

  const documents = Array.isArray(body.documents) ? body.documents : []
  const docError = validateDocuments(documents)
  if (docError) return NextResponse.json({ error: docError }, { status: 422 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const db = createServiceClient()

  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('credit_applications')
      .select('id', { count: 'exact', head: true })
      .eq('submitted_ip', ip)
      .gte('created_at', since)
    if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many applications from this connection. Please try again later or call 011 493 1336.' },
        { status: 429 },
      )
    }
  }

  const id = crypto.randomUUID()
  const reference = makeReference()
  const stored = documents.map((d, i) => ({
    kind: d.kind,
    name: d.name.slice(0, 200),
    size: d.size,
    type: d.type,
    path: `${id}/${d.kind}-${i + 1}-${safeName(d.name)}`,
  }))

  const { signature, ...data } = application
  const limit = Number(application.creditLimit.replace(/[\s,R]/g, ''))

  const insert = await db.from('credit_applications').insert({
    id,
    reference,
    sales_rep: application.salesRep || null,
    registered_name: application.registeredName,
    trading_name: application.tradingName || null,
    registration_number: application.registrationNumber || null,
    vat_number: application.vatNumber || null,
    entity_type: application.entityType,
    credit_limit_requested: Number.isFinite(limit) ? limit : null,
    buyer_email: application.buyerContact.email || null,
    data,
    signature_png: signature,
    signatory_name: application.signatoryName,
    signed_date: application.signedDate || null,
    terms_version: TERMS_VERSION,
    documents: stored,
    submitted_ip: ip,
    submitted_user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
  })
  if (insert.error) {
    console.error('[credit-application] insert failed', insert.error)
    return NextResponse.json(
      { error: 'We could not save your application. Please try again or call 011 493 1336.' },
      { status: 500 },
    )
  }

  const uploads: { path: string; token: string }[] = []
  for (const doc of stored) {
    const signed = await db.storage.from(BUCKET).createSignedUploadUrl(doc.path)
    if (signed.error || !signed.data) {
      console.error('[credit-application] signed upload url failed', signed.error)
      continue
    }
    uploads.push({ path: doc.path, token: signed.data.token })
  }

  const origin = request.headers.get('origin') || request.nextUrl.origin
  await Promise.all([
    sendEmail(
      creditTeamEmail(),
      `New credit application ${reference} – ${application.registeredName}`,
      adminEmailHtml(reference, application, documents, `${origin}/admin?tab=credit-applications&id=${id}`),
    ),
    application.buyerContact.email
      ? sendEmail(
          application.buyerContact.email,
          `Credit application received – ${reference}`,
          applicantEmailHtml(reference, application),
        )
      : Promise.resolve(false),
  ])

  return NextResponse.json({ reference, uploads })
}
