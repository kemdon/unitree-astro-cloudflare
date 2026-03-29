export type D1QueryResult<T> = {
  results?: T[]
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1QueryResult<T>>
  run(): Promise<unknown>
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
}

export type R2HttpMetadataLike = {
  contentType?: string
  contentLanguage?: string
  contentDisposition?: string
  contentEncoding?: string
  cacheControl?: string
  cacheExpiry?: Date
}

export interface R2ObjectLike {
  key: string
  size: number
  uploaded: Date
  httpEtag: string
  httpMetadata?: R2HttpMetadataLike
  writeHttpMetadata(headers: Headers): void
}

export interface R2ObjectBodyLike extends R2ObjectLike {
  body: ReadableStream | null
}

export type R2ListOptionsLike = {
  cursor?: string
  limit?: number
  prefix?: string
  include?: ('httpMetadata' | 'customMetadata')[]
}

export type R2ListResultLike = {
  objects: R2ObjectLike[]
  truncated: boolean
  cursor?: string
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string,
    options?: {
      httpMetadata?: R2HttpMetadataLike
    },
  ): Promise<R2ObjectLike | null>
  delete(keys: string | string[]): Promise<void>
  list(options?: R2ListOptionsLike): Promise<R2ListResultLike>
}

export type CloudflareExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

export type CloudflareEnv = {
  DB: D1DatabaseLike
  MEDIA_BUCKET: R2BucketLike
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
}
