import type { APIRoute } from 'astro'
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(ADMIN_SESSION_COOKIE_NAME, {
    path: '/',
  })

  return redirect('/admin/login', 302)
}
