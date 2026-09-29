import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { DOCUMENTS_BUCKET, DOCUMENT_MIME, MAX_DOCUMENT_BYTES } from '../storage'

// Issues a one-time upload URL inside the signed-in customer's own folder.
// The bucket is private and the app does not use Supabase Auth, so browsers
// cannot write to it directly.
export async function POST(request: NextRequest) {
  const session = await getSession()
  const accountNo = session?.business_id
  if (!accountNo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { file_name, file_size, content_type } = await request.json().catch(() => ({}))
  if (typeof file_name !== 'string' || !file_name.trim()) {
    return NextResponse.json({ error: 'Missing file name' }, { status: 400 })
  }
  if (!DOCUMENT_MIME.includes(content_type)) {
    return NextResponse.json({ error: 'Only PDF or image files can be uploaded' }, { status: 400 })
  }
  if (!(Number(file_size) > 0) || Number(file_size) > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: 'Files must be under 10 MB' }, { status: 400 })
  }

  const safe = file_name.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-100) || 'document'
  const path = `${accountNo}/${Date.now()}_${safe}`
  const { data, error } = await createServiceClient().storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path)
  if (error || !data) {
    console.error('[documents] signed upload url failed', error)
    return NextResponse.json({ error: 'Could not prepare the upload' }, { status: 500 })
  }
  return NextResponse.json({ path, token: data.token })
}
