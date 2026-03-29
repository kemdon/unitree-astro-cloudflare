import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const port = process.env.PLAYWRIGHT_PORT ?? String(4500 + Math.floor(Math.random() * 500))

const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PLAYWRIGHT_PORT: port,
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

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
