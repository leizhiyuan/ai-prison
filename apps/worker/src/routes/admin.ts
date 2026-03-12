import { Hono } from 'hono'
import { adminAuth } from '../middleware/auth'

type Bindings = { DB: D1Database; ADMIN_TOKEN: string }
const admin = new Hono<{ Bindings: Bindings }>()

admin.use('*', adminAuth)

admin.get('/pending', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, m.name as model_name FROM cases c
     JOIN models m ON c.model_id = m.id
     WHERE c.status = 'pending' ORDER BY c.created_at ASC`
  ).all()
  return c.json(results)
})

admin.post('/approve/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`UPDATE cases SET status='approved' WHERE id=?`).bind(id).run()

  const caseRow = await c.env.DB.prepare('SELECT model_id, severity FROM cases WHERE id=?').bind(id).first() as { model_id: string; severity: number } | null
  if (caseRow) {
    await c.env.DB.prepare(
      `UPDATE models SET
         incident_count = (SELECT COUNT(*) FROM cases WHERE model_id=? AND status='approved'),
         severity_score = (SELECT COALESCE(SUM(severity),0) FROM cases WHERE model_id=? AND status='approved')
       WHERE id=?`
    ).bind(caseRow.model_id, caseRow.model_id, caseRow.model_id).run()
  }

  return c.json({ success: true })
})

admin.post('/reject/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`UPDATE cases SET status='rejected' WHERE id=?`).bind(id).run()
  return c.json({ success: true })
})

export default admin
