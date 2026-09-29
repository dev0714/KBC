export const DOCUMENTS_BUCKET = 'documents'
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const DOCUMENT_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']

// Older rows stored a full Supabase "public" URL; newer rows store the object
// path. Either way, return the path inside the documents bucket.
export function documentObjectPath(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null
  const match = storagePath.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/documents\/([^?#]+)/)
  if (match) return decodeURIComponent(match[1])
  if (/^https?:\/\//i.test(storagePath)) return null
  return storagePath.replace(/^\/+/, '')
}
