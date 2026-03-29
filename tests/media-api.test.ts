import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, POST } from '../src/pages/api/media'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const uploadsDir = path.join(rootDir, 'public', 'uploads')
const testDir = path.join(uploadsDir, '__vitest-media-api__')

type StoredObject = {
  key: string
  size: number
  uploaded: Date
  httpEtag: string
  httpMetadata?: {
    cacheControl?: string
    contentType?: string
  }
  body: ReadableStream | null
  writeHttpMetadata(headers: Headers): void
}

function createStoredObject(
  key: string,
  size: number,
  uploadedAt: string,
  metadata: StoredObject['httpMetadata'] = {},
): StoredObject {
  return {
    key,
    size,
    uploaded: new Date(uploadedAt),
    httpEtag: `"etag-${key}"`,
    httpMetadata: metadata,
    body: null,
    writeHttpMetadata(headers) {
      if (metadata.cacheControl) {
        headers.set('cache-control', metadata.cacheControl)
      }

      if (metadata.contentType) {
        headers.set('content-type', metadata.contentType)
      }
    },
  }
}

async function toByteLength(value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string) {
  if (value instanceof ArrayBuffer) {
    return value.byteLength
  }

  if (ArrayBuffer.isView(value)) {
    return value.byteLength
  }

  if (value instanceof Blob) {
    return value.size
  }

  if (typeof value === 'string') {
    return new TextEncoder().encode(value).byteLength
  }

  throw new Error('Unsupported test upload value')
}

function createRuntimeEnv() {
  const objects = new Map<string, StoredObject>()

  const env = {
    DB: {} as any,
    MEDIA_BUCKET: {
      async get(key: string) {
        return objects.get(key) ?? null
      },
      async put(key: string, value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string, options?: any) {
        const stored = createStoredObject(
          key,
          await toByteLength(value),
          new Date('2026-03-21T00:00:00.000Z').toISOString(),
          options?.httpMetadata,
        )
        objects.set(key, stored)
        return stored
      },
      async delete(key: string) {
        if (!objects.has(key)) {
          throw new Error('ENOENT')
        }

        objects.delete(key)
      },
      async list() {
        return {
          objects: [...objects.values()],
          truncated: false,
        }
      },
    },
  }

  return {
    env,
    objects,
  }
}

describe('media api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('GET /api/media returns media file list', async () => {
    const runtime = createRuntimeEnv()
    runtime.objects.set('hero.png', createStoredObject('hero.png', 4, '2026-03-21T00:00:00.000Z', { contentType: 'image/png' }))

    const response = await GET({
      locals: {
        env: runtime.env,
      },
    } as any)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      files: [
        {
          name: 'hero.png',
          url: '/uploads/hero.png',
          size: 4,
        },
      ],
    })
  })

  it('POST /api/media returns 400 when file is missing', async () => {
    const runtime = createRuntimeEnv()
    const formData = new FormData()

    const response = await POST({
      request: new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData,
      }),
      locals: {
        env: runtime.env,
      },
    } as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Missing file',
    })
  })

  it('POST /api/media sanitizes uploaded file name', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    const runtime = createRuntimeEnv()
    const formData = new FormData()
    formData.append('file', new File(['test'], 'my file(1).png', { type: 'image/png' }))

    const response = await POST({
      request: new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData,
      }),
      locals: {
        env: runtime.env,
      },
    } as any)

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      file: {
        name: '1700000000000-my-file-1-.png',
        url: '/uploads/1700000000000-my-file-1-.png',
      },
    })
    expect(runtime.objects.has('1700000000000-my-file-1-.png')).toBe(true)
  })

  it('POST /api/media saves file to public/uploads when MEDIA_BUCKET is unavailable', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000001)
    const formData = new FormData()
    formData.append('file', new File(['local-test'], 'folder/demo image.png', { type: 'image/png' }))

    const response = await POST({
      request: new Request('http://localhost/api/media', {
        method: 'POST',
        body: formData,
      }),
      locals: {},
    } as any)

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      file: {
        name: '1700000000001-folder/demo-image.png',
        url: '/uploads/1700000000001-folder/demo-image.png',
        size: 10,
      },
    })

    await expect(fs.readFile(path.join(testDir, '..', '1700000000001-folder', 'demo-image.png'), 'utf8')).resolves.toBe('local-test')
    await fs.rm(path.join(testDir, '..', '1700000000001-folder'), { recursive: true, force: true })
  })

  it('DELETE /api/media returns 400 when file name is missing', async () => {
    const runtime = createRuntimeEnv()
    const response = await DELETE({
      request: new Request('http://localhost/api/media', {
        method: 'DELETE',
      }),
      locals: {
        env: runtime.env,
      },
    } as any)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Missing file name',
    })
  })

  it('DELETE /api/media returns 404 when file does not exist', async () => {
    const runtime = createRuntimeEnv()

    const response = await DELETE({
      request: new Request('http://localhost/api/media?name=missing.png', {
        method: 'DELETE',
      }),
      locals: {
        env: runtime.env,
      },
    } as any)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'File not found',
    })
  })

  it('DELETE /api/media removes local file when MEDIA_BUCKET is unavailable', async () => {
    const localDir = path.join(uploadsDir, '__vitest-media-api__', 'nested')
    const localFile = path.join(localDir, 'hero.png')
    await fs.mkdir(localDir, { recursive: true })
    await fs.writeFile(localFile, 'hero')

    const response = await DELETE({
      request: new Request('http://localhost/api/media?name=__vitest-media-api__/nested/hero.png', {
        method: 'DELETE',
      }),
      locals: {},
    } as any)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
    })
    await expect(fs.access(localFile)).rejects.toBeTruthy()
    await expect(fs.access(path.join(uploadsDir, '__vitest-media-api__', 'nested'))).rejects.toBeTruthy()
  })
})
