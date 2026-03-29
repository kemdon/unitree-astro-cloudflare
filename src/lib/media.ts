import type { CloudflareEnv, R2ObjectBodyLike, R2ObjectLike } from './cloudflare-env'
import type { MediaFile } from './media-types'

const PUBLIC_MEDIA_PREFIX = '/uploads'
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

type NodePathModule = typeof import('node:path')
type NodeFsModule = typeof import('node:fs/promises')
type NodeUrlModule = typeof import('node:url')

let localUploadDirPromise: Promise<string> | null = null

async function getNodePathModule() {
  const specifier = ['node', 'path'].join(':')
  return import(/* @vite-ignore */ specifier) as Promise<NodePathModule>
}

async function getNodeFsModule() {
  const specifier = ['node', 'fs/promises'].join(':')
  return import(/* @vite-ignore */ specifier) as Promise<NodeFsModule>
}

async function getNodeUrlModule() {
  const specifier = ['node', 'url'].join(':')
  return import(/* @vite-ignore */ specifier) as Promise<NodeUrlModule>
}

async function getLocalUploadDir() {
  if (!localUploadDirPromise) {
    localUploadDirPromise = (async () => {
      const [{ fileURLToPath }, path] = await Promise.all([getNodeUrlModule(), getNodePathModule()])
      const rootDir = fileURLToPath(new URL('../..', import.meta.url))
      return path.join(rootDir, 'public', 'uploads')
    })()
  }

  return localUploadDirPromise
}

function requireEnv(env?: CloudflareEnv) {
  if (!env) {
    throw new Error('Cloudflare bindings are unavailable. Ensure the request is running through the Cloudflare middleware.')
  }

  return env
}

function normalizeMediaSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export function sanitizeFileName(name: string) {
  const segments = name
    .split(/[\\/]+/)
    .map((segment) => normalizeMediaSegment(segment))
    .filter(Boolean)

  return segments.join('/') || 'upload.bin'
}

export function buildMediaUrl(key: string) {
  const normalized = key
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${PUBLIC_MEDIA_PREFIX}/${normalized}`
}

function toMediaFile(object: R2ObjectLike): MediaFile {
  return {
    name: object.key,
    url: buildMediaUrl(object.key),
    size: object.size,
    updatedAt: object.uploaded.toISOString(),
  }
}

function getContentType(filePath: string) {
  const extension = filePath.split('.').pop()?.toLowerCase()
  if (!extension) {
    return 'application/octet-stream'
  }

  return CONTENT_TYPE_BY_EXT[`.${extension}`] ?? 'application/octet-stream'
}

async function getLocalMediaPath(key: string) {
  const path = await getNodePathModule()
  const localUploadDir = await getLocalUploadDir()
  return path.join(localUploadDir, ...key.split('/').filter(Boolean))
}

async function toLocalMediaObject(key: string): Promise<R2ObjectBodyLike | null> {
  const fs = await getNodeFsModule()
  const absolutePath = await getLocalMediaPath(key)
  const stats = await fs.stat(absolutePath).catch(() => null)

  if (!stats?.isFile()) {
    return null
  }

  const body = new Blob([await fs.readFile(absolutePath)], {
    type: getContentType(absolutePath),
  }).stream()
  const httpMetadata = {
    cacheControl: 'public, max-age=31536000, immutable',
    contentType: getContentType(absolutePath),
  }

  return {
    key,
    size: stats.size,
    uploaded: stats.mtime,
    httpEtag: `"local-${stats.size}-${Math.floor(stats.mtimeMs)}"`,
    httpMetadata,
    body,
    writeHttpMetadata(headers: Headers) {
      headers.set('cache-control', httpMetadata.cacheControl)
      headers.set('content-type', httpMetadata.contentType)
    },
  }
}

async function listLocalMediaFilesInDir(dir: string, prefix = ''): Promise<MediaFile[]> {
  const fs = await getNodeFsModule()
  const path = await getNodePathModule()
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith('.')) {
        return []
      }

      const absolutePath = path.join(dir, entry.name)
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        return listLocalMediaFilesInDir(absolutePath, relativePath)
      }

      const stats = await fs.stat(absolutePath)
      return [
        {
          name: relativePath.replace(/\\/g, '/'),
          url: buildMediaUrl(relativePath),
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
        } satisfies MediaFile,
      ]
    }),
  )

  return nestedFiles.flat()
}

async function listAllObjects(env: CloudflareEnv) {
  const objects: R2ObjectLike[] = []
  let cursor: string | undefined

  do {
    const result = await env.MEDIA_BUCKET.list({
      cursor,
      include: ['httpMetadata'],
      limit: 1000,
    })

    objects.push(...result.objects.filter((object) => !object.key.endsWith('/')))
    cursor = result.truncated ? result.cursor : undefined
  } while (cursor)

  return objects
}

async function removeEmptyParentDirs(startDir: string) {
  const fs = await getNodeFsModule()
  const path = await getNodePathModule()
  const localUploadDir = await getLocalUploadDir()
  let currentDir = startDir

  while (currentDir.startsWith(localUploadDir) && currentDir !== localUploadDir) {
    const entries = await fs.readdir(currentDir).catch(() => null)
    if (!entries || entries.length > 0) {
      return
    }

    await fs.rmdir(currentDir).catch(() => undefined)
    currentDir = path.dirname(currentDir)
  }
}

export async function listMediaFiles(env?: CloudflareEnv): Promise<MediaFile[]> {
  if (!env?.MEDIA_BUCKET) {
    const localUploadDir = await getLocalUploadDir()
    const files = await listLocalMediaFilesInDir(localUploadDir)
    return files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  const objects = await listAllObjects(env)
  return objects.map(toMediaFile).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveMediaFile(env: CloudflareEnv | undefined, file: File) {
  const rawName = sanitizeFileName(file.name || 'upload.bin')
  const timestamp = Date.now()
  const fileName = `${timestamp}-${rawName}`
  const body = await file.arrayBuffer()

  if (!env?.MEDIA_BUCKET) {
    const fs = await getNodeFsModule()
    const path = await getNodePathModule()
    const absolutePath = await getLocalMediaPath(fileName)
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, new Uint8Array(body))
    const stats = await fs.stat(absolutePath)

    return {
      name: fileName,
      url: buildMediaUrl(fileName),
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    }
  }

  const runtimeEnv = requireEnv(env)
  const saved =
    (await runtimeEnv.MEDIA_BUCKET.put(fileName, body, {
      httpMetadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: file.type || 'application/octet-stream',
      },
    })) ?? null

  return {
    name: fileName,
    url: buildMediaUrl(fileName),
    size: file.size,
    updatedAt: saved?.uploaded.toISOString() ?? new Date().toISOString(),
  }
}

export async function removeMediaFile(env: CloudflareEnv | undefined, name: string) {
  const safeName = sanitizeFileName(name)

  if (!env?.MEDIA_BUCKET) {
    const fs = await getNodeFsModule()
    const path = await getNodePathModule()
    const absolutePath = await getLocalMediaPath(safeName)
    await fs.rm(absolutePath)
    await removeEmptyParentDirs(path.dirname(absolutePath))
    return
  }

  const runtimeEnv = requireEnv(env)
  await runtimeEnv.MEDIA_BUCKET.delete(safeName)
}

export async function loadMediaObject(env: CloudflareEnv | undefined, key: string): Promise<R2ObjectBodyLike | null> {
  const safeKey = sanitizeFileName(key)

  if (!env?.MEDIA_BUCKET) {
    return toLocalMediaObject(safeKey)
  }

  const runtimeEnv = requireEnv(env)
  return runtimeEnv.MEDIA_BUCKET.get(safeKey)
}
