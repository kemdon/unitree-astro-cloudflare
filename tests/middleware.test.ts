import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_SESSION_COOKIE_NAME,
  authorizeAdminRequest,
  createAdminSessionToken,
  hasValidAdminSession,
  validateAdminLogin,
} from '../src/lib/admin-auth'

const originalAdminUsername = process.env.ADMIN_USERNAME
const originalAdminPassword = process.env.ADMIN_PASSWORD

function createRequest(pathname: string, headers?: HeadersInit) {
  return new Request(`http://localhost:3031${pathname}`, {
    headers,
  })
}

afterEach(() => {
  if (originalAdminUsername === undefined) {
    delete process.env.ADMIN_USERNAME
  } else {
    process.env.ADMIN_USERNAME = originalAdminUsername
  }

  if (originalAdminPassword === undefined) {
    delete process.env.ADMIN_PASSWORD
  } else {
    process.env.ADMIN_PASSWORD = originalAdminPassword
  }

  vi.restoreAllMocks()
})

describe('admin auth', () => {
  it('accepts the default admin credentials', () => {
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD

    expect(validateAdminLogin('template-admin', 'change-me-immediately')).toBe(true)
    expect(validateAdminLogin('template-admin', 'wrong')).toBe(false)
  })

  it('recognizes a valid admin session cookie', async () => {
    const token = await createAdminSessionToken()
    const request = createRequest('/admin', {
      Cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
    })

    await expect(hasValidAdminSession(request)).resolves.toBe(true)
  })

  it('redirects protected admin pages to the login page when unauthenticated', async () => {
    const response = await authorizeAdminRequest(createRequest('/admin/pages?tab=all'))

    expect(response).toBeInstanceOf(Response)
    if (!response) {
      throw new Error('Expected redirect response')
    }

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/admin/login?next=%2Fadmin%2Fpages%3Ftab%3Dall')
  })

  it('returns 401 for protected api routes without a session', async () => {
    const response = await authorizeAdminRequest(createRequest('/api/pages'))

    expect(response).toBeInstanceOf(Response)
    if (!response) {
      throw new Error('Expected api auth response')
    }

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'Authentication required',
    })
  })

  it('allows protected routes when a valid session cookie is present', async () => {
    const token = await createAdminSessionToken()
    const response = await authorizeAdminRequest(
      createRequest('/admin/pages', {
        Cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
      }),
    )

    expect(response).toBeNull()
  })

  it('redirects the login page back to /admin when already authenticated', async () => {
    const token = await createAdminSessionToken()
    const response = await authorizeAdminRequest(
      createRequest('/admin/login', {
        Cookie: `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
      }),
    )

    expect(response).toBeInstanceOf(Response)
    if (!response) {
      throw new Error('Expected redirect response')
    }

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/admin')
  })
})
