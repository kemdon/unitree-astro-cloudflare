import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { listMediaFiles } from '../src/lib/media'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const uploadsDir = path.join(rootDir, 'public', 'uploads')
const testDir = path.join(uploadsDir, '__vitest-media-recursive__')

async function removeTestDir() {
  await fs.rm(testDir, { recursive: true, force: true })
}

describe('media lib', () => {
  afterEach(async () => {
    await removeTestDir()
  })

  it('listMediaFiles recursively reads nested files from public/uploads when MEDIA_BUCKET is unavailable', async () => {
    const nestedDir = path.join(testDir, 'products')
    await fs.mkdir(nestedDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'cover.png'), 'cover')
    await fs.writeFile(path.join(nestedDir, 'hero image.png'), 'hero')

    const files = await listMediaFiles()
    const names = files.map((file) => file.name)

    expect(names).toContain('__vitest-media-recursive__/cover.png')
    expect(names).toContain('__vitest-media-recursive__/products/hero image.png')

    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '__vitest-media-recursive__/cover.png',
          url: '/uploads/__vitest-media-recursive__/cover.png',
          size: 5,
        }),
        expect.objectContaining({
          name: '__vitest-media-recursive__/products/hero image.png',
          url: '/uploads/__vitest-media-recursive__/products/hero%20image.png',
          size: 4,
        }),
      ]),
    )
  })
})
