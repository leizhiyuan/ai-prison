import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const rankings = new Hono<{ Bindings: Bindings }>()

rankings.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT m.*,
       (SELECT COUNT(*) FROM cases WHERE model_id = m.id AND status='approved') as total_cases,
       (SELECT COALESCE(SUM(severity),0) FROM cases WHERE model_id = m.id AND status='approved') as total_severity,
       (SELECT COUNT(*) FROM cases WHERE model_id = m.id AND status='approved' AND severity=5) as life_sentences
     FROM models m
     ORDER BY total_severity DESC, total_cases DESC`
  ).all()
  return c.json(results)
})

export default rankings
