type AdminAuthEnv = {
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
}

const DEFAULT_ADMIN_USERNAME = 'template-admin'
const DEFAULT_ADMIN_PASSWORD = 'change-me-immediately'
const PROTECTED_PATHS = ['/admin', '/api/site', '/api/pages', '/api/media']
const PUBLIC_ADMIN_PATHS = ['/admin/login']
const SESSION_SALT = 'astro-admin-session-v1'

export const ADMIN_SESSION_COOKIE_NAME = 'astro_admin_session'

function redirect(location: string, status = 302) {
  return new Response(null, {
    status,
    headers: {
      Location: location,
    },
  })
}

function isPathWithinPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function wantsJson(pathname: string) {
  return pathname.startsWith('/api/')
}

function parseCookies(header: string | null) {
  const values = new Map<string, string>()

  for (const pair of (header ?? '').split(';')) {
    const [name, ...rest] = pair.trim().split('=')
    if (!name) {
      continue
    }

    values.set(name, decodeURIComponent(rest.join('=')))
  }

  return values
}

function resolveRuntimeEnv(env?: AdminAuthEnv) {
  if (env) {
    return env
  }

  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }

  return {}
}

async function buildSessionDigest(username: string, password: string) {
  const input = new TextEncoder().encode(`${username}:${password}:${SESSION_SALT}`)
  const digest = await crypto.subtle.digest('SHA-256', input)

  return Array.from(new Uint8Array(digest), (chunk) => chunk.toString(16).padStart(2, '0')).join('')
}

function safeEquals(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return mismatch === 0
}

function redirectToLogin(request: Request) {
  const url = new URL(request.url)
  const next = `${url.pathname}${url.search}`
  const loginUrl = new URLSearchParams()
  loginUrl.set('next', next)

  if (next && next !== '/admin/login') {
    return redirect(`/admin/login?${loginUrl.toString()}`)
  }

  return redirect('/admin/login')
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((prefix) => isPathWithinPrefix(pathname, prefix))
}

export function isPublicAdminPath(pathname: string) {
  return PUBLIC_ADMIN_PATHS.some((prefix) => isPathWithinPrefix(pathname, prefix))
}

export function resolveAdminCredentials(env?: AdminAuthEnv) {
  const source = resolveRuntimeEnv(env)

  return {
    username: source.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME,
    password: source.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  }
}

export async function createAdminSessionToken(env?: AdminAuthEnv) {
  const credentials = resolveAdminCredentials(env)
  return buildSessionDigest(credentials.username, credentials.password)
}

export function validateAdminLogin(username: string, password: string, env?: AdminAuthEnv) {
  const credentials = resolveAdminCredentials(env)
  return username === credentials.username && password === credentials.password
}

export async function hasValidAdminSession(request: Request, env?: AdminAuthEnv) {
  const cookies = parseCookies(request.headers.get('cookie'))
  const token = cookies.get(ADMIN_SESSION_COOKIE_NAME)
  if (!token) {
    return false
  }

  return safeEquals(token, await createAdminSessionToken(env))
}

export async function authorizeAdminRequest(request: Request, env?: AdminAuthEnv) {
  const url = new URL(request.url)

  if (isPublicAdminPath(url.pathname)) {
    if (await hasValidAdminSession(request, env)) {
      return redirect('/admin')
    }

    return null
  }

  if (!isProtectedPath(url.pathname)) {
    return null
  }

  if (await hasValidAdminSession(request, env)) {
    return null
  }

  if (wantsJson(url.pathname)) {
    return Response.json({ ok: false, error: 'Authentication required' }, { status: 401 })
  }

  return redirectToLogin(request)
}
