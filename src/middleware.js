import { env } from 'cloudflare:workers'
import { defineMiddleware } from 'astro:middleware'
import { authorizeAdminRequest } from '@/lib/admin-auth'

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.env = env

  const failure = await authorizeAdminRequest(context.request, env)
  if (failure) {
    return failure
  }

  return next()
})
