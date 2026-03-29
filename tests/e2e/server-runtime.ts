import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const runtimeDir = path.join(os.tmpdir(), 'astro-cloudflare-admin-template-e2e')

export const E2E_HOST = '127.0.0.1'
export const E2E_PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4600)
export const E2E_SERVER_URL = `http://${E2E_HOST}:${E2E_PORT}`
export const E2E_PID_FILE = path.join(runtimeDir, 'server.pid')
export const E2E_LOG_FILE = path.join(runtimeDir, 'server.log')

export async function ensureRuntimeDir() {
  await fs.mkdir(runtimeDir, { recursive: true })
}
