import type { APIRoute } from 'astro'
import { listMediaFiles, removeMediaFile, saveMediaFile } from '@/lib/media'

export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = locals?.env
  return Response.json({
    ok: true,
    uploadBaseUrl: '/uploads',
    files: await listMediaFiles(runtimeEnv),
  })
}

export const POST: APIRoute = async ({ request, locals }) => {
  const formData = await request.formData()
  const file = formData.get('file')
  const runtimeEnv = locals?.env

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: 'Missing file' }, { status: 400 })
  }

  const saved = await saveMediaFile(runtimeEnv, file)
  return Response.json({ ok: true, file: saved }, { status: 201 })
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const runtimeEnv = locals?.env

  if (!name) {
    return Response.json({ ok: false, error: 'Missing file name' }, { status: 400 })
  }

  try {
    await removeMediaFile(runtimeEnv, name)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false, error: 'File not found' }, { status: 404 })
  }
}
