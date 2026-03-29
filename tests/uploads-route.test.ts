import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { GET, HEAD } from '../src/pages/uploads/[...key]'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const uploadsDir = path.join(rootDir, 'public', 'uploads')
const testDir = path.join(uploadsDir, '__vitest-uploads-route__')

async function removeTestDir() {
  await fs.rm(testDir, { recursive: true, force: true })
}

describe('uploads route', () => {
  afterEach(async () => {
    await removeTestDir()
  })

  it('GET /uploads/[...key] serves local file when MEDIA_BUCKET is unavailable', async () => {
    const nestedDir = path.join(testDir, 'docs')
    await fs.mkdir(nestedDir, { recursive: true })
    await fs.writeFile(path.join(nestedDir, 'guide.txt'), 'hello local uploads')

    const response = await GET({
      params: {
        key: '__vitest-uploads-route__/docs/guide.txt',
      },
      locals: {},
    } as any)

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('hello local uploads')
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
  })

  it('HEAD /uploads/[...key] returns metadata for local file when MEDIA_BUCKET is unavailable', async () => {
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'hero.png'), 'hero')

    const response = await HEAD({
      params: {
        key: '__vitest-uploads-route__/hero.png',
      },
      locals: {},
    } as any)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('content-length')).toBe('4')
    expect(response.headers.get('etag')).toMatch(/^"local-/)
  })
})
