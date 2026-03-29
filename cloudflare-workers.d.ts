import type { CloudflareEnv } from './src/lib/cloudflare-env'

declare module 'cloudflare:workers' {
  export const env: CloudflareEnv
}

export {}
