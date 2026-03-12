import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const models = new Hono<{ Bindings: Bindings }>()

models.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM models ORDER BY incident_count DESC'
  ).all()
  return c.json(results)
})

export default models
