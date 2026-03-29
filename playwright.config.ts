import { defineConfig } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4500 + Math.floor(Math.random() * 500))
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    headless: true,
    launchOptions: {
      args: ['--no-proxy-server'],
    },
  },
})
