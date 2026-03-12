import { useState } from 'react'

const CATEGORIES = [
  { value: 'hallucination', label: '幻觉 / Hallucination' },
  { value: 'bias', label: '偏见 / Bias' },
  { value: 'safety', label: '安全风险 / Safety Risk' },
  { value: 'privacy', label: '隐私泄露 / Privacy Leak' },
  { value: 'other', label: '其他 / Other' },
]

interface Model { id: string; name: string; provider: string }

export default function SubmitForm({ models, apiUrl }: { models: Model[]; apiUrl: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch(`${apiUrl}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, severity: parseInt(data.severity as string) })
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error || 'Submit failed')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (status === 'success') {
    return (
      <div className="prison-card text-center py-12">
        <div className="text-prison-green text-2xl mb-4">✓</div>
        <div className="text-prison-green font-bold mb-2">案件已受理</div>
        <div className="text-prison-muted text-sm">Case submitted successfully. Pending review.</div>
        <button onClick={() => setStatus('idle')} className="prison-btn-green mt-6 text-xs">继续提交</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-prison-muted mb-1">被告模型 / Model *</label>
        <select name="model_id" required
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
          <option value="">选择模型</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">案件标题（中文）*</label>
        <input name="title" required maxLength={100}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="简短描述失误内容" />
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">Title (English)</label>
        <input name="title_en" maxLength={100}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="English title (optional)" />
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">详细描述（中文）*</label>
        <textarea name="description" required rows={4} maxLength={2000}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm resize-none"
          placeholder="详细描述失误经过、影响和后果" />
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">Description (English)</label>
        <textarea name="description_en" rows={3} maxLength={2000}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm resize-none"
          placeholder="English description (optional)" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-prison-muted mb-1">罪行类型 / Category *</label>
          <select name="category" required
            className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
            <option value="">选择类型</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-prison-muted mb-1">严重程度 / Severity *</label>
          <select name="severity" required
            className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
            <option value="">1-5</option>
            <option value="1">1 — ⚠️ 警告</option>
            <option value="2">2 — 🔒 拘留</option>
            <option value="3">3 — ⛓️ 有期</option>
            <option value="4">4 — 🔴 重刑</option>
            <option value="5">5 — ☠️ 无期</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">来源链接 / Source URL</label>
        <input name="source_url" type="url"
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="https://..." />
      </div>

      {status === 'error' && (
        <div className="border border-prison-red text-prison-red text-xs px-3 py-2">
          错误: {errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="prison-btn-green w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">
        {status === 'loading' ? '提交中...' : '提交案件 / SUBMIT CASE'}
      </button>
      <p className="text-prison-muted text-xs text-center">匿名提交 · 经审核后公开 · Anonymous submission · Published after review</p>
    </form>
  )
}
