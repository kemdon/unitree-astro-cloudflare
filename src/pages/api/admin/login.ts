import type { APIRoute } from 'astro'
import { ADMIN_SESSION_COOKIE_NAME, createAdminSessionToken, validateAdminLogin } from '@/lib/admin-auth'

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  const formData = await request.formData()
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/admin')
  const runtimeEnv = locals?.env

  if (!validateAdminLogin(username, password, runtimeEnv)) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('error', 'invalid')
    if (next && next.startsWith('/')) {
      loginUrl.searchParams.set('next', next)
    }
    return redirect(loginUrl.pathname + loginUrl.search, 302)
  }

  cookies.set(ADMIN_SESSION_COOKIE_NAME, await createAdminSessionToken(runtimeEnv), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: new URL(request.url).protocol === 'https:',
    maxAge: 60 * 60 * 8,
  })

  return redirect(next.startsWith('/') ? next : '/admin', 302)
}
