import fs from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { E2E_PID_FILE } from './server-runtime'

const execFileAsync = promisify(execFile)

export default async function globalTeardown() {
  const pidRaw = await fs.readFile(E2E_PID_FILE, 'utf-8').catch(() => '')
  const pid = Number(pidRaw)

  if (!pid) {
    return
  }

  try {
    if (process.platform === 'win32') {
      await execFileAsync('taskkill', ['/PID', String(pid), '/T', '/F'])
    } else {
      process.kill(-pid, 'SIGTERM')
    }
  } catch {
    // Ignore cleanup failures from already-exited processes.
  }

  await fs.rm(E2E_PID_FILE, { force: true })
}
