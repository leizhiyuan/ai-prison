import { Hono } from 'hono'
import { cors } from 'hono/cors'
import cases from './routes/cases'
import models from './routes/models'
import rankings from './routes/rankings'
import submit from './routes/submit'
import admin from './routes/admin'

type Bindings = { DB: D1Database; ADMIN_TOKEN: string }
const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({ origin: '*' }))

app.get('/api/health', (c) => c.json({ status: 'ok', time: Date.now() }))
app.route('/api/cases', cases)
app.route('/api/models', models)
app.route('/api/rankings', rankings)
app.route('/api/submit', submit)
app.route('/api/admin', admin)

export default app
