import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const rootDir = fileURLToPath(new URL('..', import.meta.url))
const uploadDir = path.join(rootDir, 'public', 'uploads')
const wranglerConfigFile = path.join(rootDir, 'wrangler.jsonc')

const CONTENT_TYPE_BY_EXT = {
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

function getWranglerCommand() {
  return path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler')
}

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`
  }

  return value
}

async function runWrangler(args) {
  const wranglerCommand = getWranglerCommand()

  if (process.platform === 'win32') {
    await execFileAsync(
      'cmd.exe',
      ['/d', '/s', '/c', `${quoteArg(wranglerCommand)} ${args.map(quoteArg).join(' ')}`],
      {
        cwd: rootDir,
        env: {
          ...process.env,
        },
      },
    )
    return
  }

  await execFileAsync(wranglerCommand, args, {
    cwd: rootDir,
    env: {
      ...process.env,
    },
  })
}

function resolveMode() {
  if (process.argv.includes('--remote')) {
    return '--remote'
  }

  return '--local'
}

async function getBucketName() {
  const config = JSON.parse(await fs.readFile(wranglerConfigFile, 'utf-8'))
  const bucket = config.r2_buckets?.find((entry) => entry.binding === 'MEDIA_BUCKET')

  if (!bucket?.bucket_name) {
    throw new Error('Missing MEDIA_BUCKET binding in wrangler.jsonc')
  }

  return bucket.bucket_name
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith('.')) {
        return []
      }

      const absolutePath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return listFiles(absolutePath)
      }

      return [absolutePath]
    }),
  )

  return files.flat()
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  return CONTENT_TYPE_BY_EXT[extension]
}

async function main() {
  const files = await listFiles(uploadDir)
  if (files.length === 0) {
    console.log('No local uploads found. Skipping R2 sync.')
    return
  }

  const bucketName = await getBucketName()
  const mode = resolveMode()

  for (const filePath of files) {
    const relativePath = path.relative(uploadDir, filePath).replace(/\\/g, '/')
    const args = ['r2', 'object', 'put', `${bucketName}/${relativePath}`, '--file', filePath, mode]
    const contentType = getContentType(filePath)
    if (contentType) {
      args.push('--content-type', contentType)
    }

    await runWrangler(args)

    console.log(`Synced ${relativePath}`)
  }
}

await main()
