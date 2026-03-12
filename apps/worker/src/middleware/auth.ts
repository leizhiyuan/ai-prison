import { MiddlewareHandler } from 'hono'

type Env = { Bindings: { ADMIN_TOKEN: string } }

export const adminAuth: MiddlewareHandler<Env> = async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth || auth !== `Bearer ${c.env.ADMIN_TOKEN}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
