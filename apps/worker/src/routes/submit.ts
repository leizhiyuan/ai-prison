import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const submit = new Hono<{ Bindings: Bindings }>()

function nanoid(len = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

submit.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { model_id, title, title_en, description, description_en, category, severity, source_url } = body

  if (!model_id || !title || !description || !category || !severity) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  if (!['hallucination','bias','safety','privacy','other'].includes(category)) {
    return c.json({ error: 'Invalid category' }, 400)
  }
  if (typeof severity !== 'number' || severity < 1 || severity > 5) {
    return c.json({ error: 'Severity must be 1-5' }, 400)
  }

  const model = await c.env.DB.prepare('SELECT id FROM models WHERE id = ?').bind(model_id).first()
  if (!model) return c.json({ error: 'Unknown model' }, 400)

  const id = `case-${nanoid()}`
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(
    `INSERT INTO cases (id, model_id, title, title_en, description, description_en, category, severity, source_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(id, model_id, title, title_en || title, description, description_en || description, category, severity, source_url || null, now).run()

  return c.json({ success: true, id, message: '案件已受理，等待审核' }, 201)
})

export default submit
