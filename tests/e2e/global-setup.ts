import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { E2E_HOST, E2E_LOG_FILE, E2E_PID_FILE, E2E_PORT, E2E_SERVER_URL, ensureRuntimeDir } from './server-runtime'

function probe(url: string) {
  return new Promise<number>((resolve) => {
    const request = http.get(url, (response) => {
      response.resume()
      resolve(response.statusCode ?? 0)
    })

    request.on('error', () => resolve(0))
    request.setTimeout(2000, () => {
      request.destroy()
      resolve(0)
    })
  })
}

export default async function globalSetup() {
  await ensureRuntimeDir()
  await fsPromises.rm(E2E_LOG_FILE, { force: true })
  await fsPromises.rm(E2E_PID_FILE, { force: true })

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const devArgs = ['run', 'dev', '--', '--host', E2E_HOST, '--port', String(E2E_PORT), '--strictPort']
  const child =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', `${npmCommand} ${devArgs.join(' ')}`], {
          cwd: process.cwd(),
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          env: {
            ...process.env,
            NO_PROXY: '127.0.0.1,localhost',
            no_proxy: '127.0.0.1,localhost',
            HTTP_PROXY: '',
            HTTPS_PROXY: '',
            ALL_PROXY: '',
            http_proxy: '',
            https_proxy: '',
            all_proxy: '',
          },
        })
      : spawn(npmCommand, devArgs, {
          cwd: process.cwd(),
          detached: true,
          stdio: 'ignore',
          env: {
            ...process.env,
            NO_PROXY: '127.0.0.1,localhost',
            no_proxy: '127.0.0.1,localhost',
            HTTP_PROXY: '',
            HTTPS_PROXY: '',
            ALL_PROXY: '',
            http_proxy: '',
            https_proxy: '',
            all_proxy: '',
          },
        })

  child.unref()

  if (!child.pid) {
    throw new Error('E2E server failed to start: missing pid')
  }

  await fsPromises.writeFile(E2E_PID_FILE, String(child.pid), 'utf-8')

  const deadline = Date.now() + 120000
  while (Date.now() < deadline) {
    const status = await probe(`${E2E_SERVER_URL}/admin/login`)
    if (status === 200) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const log = fs.existsSync(E2E_LOG_FILE) ? await fsPromises.readFile(E2E_LOG_FILE, 'utf-8').catch(() => '') : ''
  throw new Error(`E2E server did not become ready.\n\n${log}`)
}
