import { describe, expect, it } from 'vitest'
import { ADMIN_SESSION_COOKIE_NAME } from '../src/lib/admin-auth'
import { POST as loginPost } from '../src/pages/api/admin/login'
import { POST as logoutPost } from '../src/pages/api/admin/logout'

function createCookiesStore() {
  const values = new Map<string, { value: string; options?: Record<string, unknown> }>()

  return {
    set(name: string, value: string, options?: Record<string, unknown>) {
      values.set(name, { value, options })
    },
    delete(name: string, options?: Record<string, unknown>) {
      values.delete(name)
      values.set(`${name}:deleted`, { value: '', options })
    },
    get(name: string) {
      return values.get(name)
    },
  }
}

describe('admin login api', () => {
  it('POST /api/admin/login sets the session cookie and redirects on success', async () => {
    const formData = new FormData()
    formData.set('username', 'template-admin')
    formData.set('password', 'change-me-immediately')
    formData.set('next', '/admin/pages')
    const cookies = createCookiesStore()

    const response = await loginPost({
      request: new Request('http://localhost/api/admin/login', {
        method: 'POST',
        body: formData,
      }),
      cookies,
      redirect: (location: string, status = 302) => Response.redirect(`http://localhost${location}`, status),
    } as any)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost/admin/pages')
    expect(cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value).toBeTruthy()
  })

  it('POST /api/admin/login redirects back to the login page on failure', async () => {
    const formData = new FormData()
    formData.set('username', 'template-admin')
    formData.set('password', 'wrong')
    formData.set('next', '/admin/pages')
    const cookies = createCookiesStore()

    const response = await loginPost({
      request: new Request('http://localhost/api/admin/login', {
        method: 'POST',
        body: formData,
      }),
      cookies,
      redirect: (location: string, status = 302) => Response.redirect(`http://localhost${location}`, status),
    } as any)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost/admin/login?error=invalid&next=%2Fadmin%2Fpages')
    expect(cookies.get(ADMIN_SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('POST /api/admin/logout clears the session cookie and redirects to login', async () => {
    const cookies = createCookiesStore()

    const response = await logoutPost({
      cookies,
      redirect: (location: string, status = 302) => Response.redirect(`http://localhost${location}`, status),
    } as any)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost/admin/login')
    expect(cookies.get(`${ADMIN_SESSION_COOKIE_NAME}:deleted`)).toBeTruthy()
  })
})
