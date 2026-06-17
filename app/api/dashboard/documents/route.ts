import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

// Inserts a document metadata row for the logged-in user's own account.
// The file itself is uploaded to storage from the client; this only records
// the resulting metadata. client_account_no is taken from the session.
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accountNo = session.business_id
  if (!accountNo) return NextResponse.json({ error: 'No account on session' }, { status: 400 })

  const { file_name, storage_path, document_type, file_size } = await request.json()

  if (!file_name || !storage_path || !document_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('documents').insert([
    {
      client_account_no: accountNo,
      file_name,
      storage_path,
      document_type,
      file_size: file_size != null ? String(file_size) : null,
    },
  ])

  if (error) {
    console.error('[documents] POST error:', error)
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
