import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  ADMIN_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default app
