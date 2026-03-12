import { Hono } from 'hono'

type Bindings = { DB: D1Database; ADMIN_TOKEN: string }

const cases = new Hono<{ Bindings: Bindings }>()

cases.get('/', async (c) => {
  const { model, category, severity, page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = `SELECT c.*, m.name as model_name, m.name_en as model_name_en, m.provider
               FROM cases c JOIN models m ON c.model_id = m.id
               WHERE c.status = 'approved'`
  const params: (string | number)[] = []

  if (model) { query += ' AND c.model_id = ?'; params.push(model) }
  if (category) { query += ' AND c.category = ?'; params.push(category) }
  if (severity) { query += ' AND c.severity = ?'; params.push(parseInt(severity)) }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  let countQuery = `SELECT COUNT(*) as total FROM cases WHERE status = 'approved'`
  const countParams: (string | number)[] = []
  if (model) { countQuery += ' AND model_id = ?'; countParams.push(model) }
  if (category) { countQuery += ' AND category = ?'; countParams.push(category) }
  if (severity) { countQuery += ' AND severity = ?'; countParams.push(parseInt(severity)) }

  const { results: countResult } = await c.env.DB.prepare(countQuery).bind(...countParams).all()
  const total = (countResult[0] as { total: number }).total

  return c.json({ cases: results, total, page: parseInt(page), limit: parseInt(limit) })
})

cases.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    `SELECT c.*, m.name as model_name, m.name_en as model_name_en, m.provider
     FROM cases c JOIN models m ON c.model_id = m.id
     WHERE c.id = ? AND c.status = 'approved'`
  ).bind(id).first()

  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

export default cases
