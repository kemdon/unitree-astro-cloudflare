/// <reference types="astro/client" />

import type { CloudflareEnv, CloudflareExecutionContextLike } from '@/lib/cloudflare-env'

declare global {
  namespace App {
    interface Locals {
      env: CloudflareEnv
      cfContext?: CloudflareExecutionContextLike
    }
  }
}

declare module 'cloudflare:workers' {
  export const env: CloudflareEnv
}

export {}
