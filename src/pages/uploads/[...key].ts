import type { APIRoute } from 'astro'
import { loadMediaObject } from '@/lib/media'

function buildMediaResponseHeaders(object: Awaited<ReturnType<typeof loadMediaObject>> extends infer T
  ? T extends { httpEtag: string; size: number; writeHttpMetadata(headers: Headers): void }
    ? T
    : never
  : never) {
  const headers = new Headers()
  object.writeHttpMetadata(headers)

  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable')
  }

  headers.set('content-length', String(object.size))
  headers.set('etag', object.httpEtag)

  return headers
}

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key ?? ''
  const object = await loadMediaObject(locals.env, key)

  if (!object) {
    return new Response('Not Found', { status: 404 })
  }

  return new Response(object.body, {
    headers: buildMediaResponseHeaders(object),
    status: 200,
  })
}

export const HEAD: APIRoute = async ({ params, locals }) => {
  const key = params.key ?? ''
  const object = await loadMediaObject(locals.env, key)

  if (!object) {
    return new Response(null, { status: 404 })
  }

  return new Response(null, {
    headers: buildMediaResponseHeaders(object),
    status: 200,
  })
}
