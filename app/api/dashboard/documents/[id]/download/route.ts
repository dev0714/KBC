import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { DOCUMENTS_BUCKET, documentObjectPath } from '../../storage'

// Redirects to a 5-minute signed download link for one of the signed-in
// customer's own documents.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const accountNo = session?.business_id
  if (!accountNo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const db = createServiceClient()
  const { data: doc } = await db
    .from('documents')
    .select('id, file_name, storage_path, client_account_no')
    .eq('id', id)
    .eq('client_account_no', accountNo)
    .maybeSingle()
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const path = documentObjectPath(doc.storage_path)
  if (!path) {
    if (doc.storage_path && /^https?:\/\//i.test(doc.storage_path)) return NextResponse.redirect(doc.storage_path)
    return NextResponse.json({ error: 'Document file is missing' }, { status: 404 })
  }

  const { data, error } = await db.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 300, { download: doc.file_name || true })
  if (error || !data?.signedUrl) {
    console.error('[documents] signed download failed', error)
    return NextResponse.json({ error: 'Document file could not be found' }, { status: 404 })
  }
  return NextResponse.redirect(data.signedUrl)
}
