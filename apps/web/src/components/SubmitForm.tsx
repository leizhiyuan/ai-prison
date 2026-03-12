import { useState } from 'react'

interface Model { id: string; name: string; name_en?: string; provider: string }
type Lang = 'zh' | 'en'

interface Props {
  models: Model[]
  apiUrl: string
  lang: Lang
}

export default function SubmitForm({ models, apiUrl, lang }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const zh = lang === 'zh'

  const categories = zh
    ? [
        { value: 'hallucination', label: '幻觉' },
        { value: 'bias', label: '偏见' },
        { value: 'safety', label: '安全风险' },
        { value: 'privacy', label: '隐私泄露' },
        { value: 'other', label: '其他' },
      ]
    : [
        { value: 'hallucination', label: 'Hallucination' },
        { value: 'bias', label: 'Bias' },
        { value: 'safety', label: 'Safety Risk' },
        { value: 'privacy', label: 'Privacy Leak' },
        { value: 'other', label: 'Other' },
      ]

  const severityLabels = zh
    ? ['⚠️ 警告', '🔒 拘留', '⛓️ 有期', '🔴 重刑', '☠️ 无期']
    : ['⚠️ Warning', '🔒 Detention', '⛓️ Fixed Term', '🔴 Heavy', '☠️ Life']

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
        <div className="text-prison-green font-bold mb-2">
          {zh ? '案件已受理' : 'Case Submitted'}
        </div>
        <div className="text-prison-muted text-sm">
          {zh ? '等待管理员审核后公开。' : 'Pending review before publication.'}
        </div>
        <button onClick={() => setStatus('idle')} className="prison-btn-green mt-6 text-xs">
          {zh ? '继续提交' : 'Submit another'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-prison-muted mb-1">
          {zh ? '被告模型 *' : 'Model *'}
        </label>
        <select name="model_id" required
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
          <option value="">{zh ? '选择模型' : 'Select model'}</option>
          {models.map(m => {
            const name = zh ? m.name : (m.name_en || m.name)
            return <option key={m.id} value={m.id}>{name} ({m.provider})</option>
          })}
        </select>
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">
          {zh ? '案件标题（中文）*' : 'Title (Chinese) *'}
        </label>
        <input name="title" required maxLength={100}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder={zh ? '简短描述失误内容' : 'Brief title in Chinese'} />
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">
          {zh ? '案件标题（英文）' : 'Title (English)'}
        </label>
        <input name="title_en" maxLength={100}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder={zh ? '英文标题（可选）' : 'English title (optional)'} />
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">
          {zh ? '详细描述（中文）*' : 'Description (Chinese) *'}
        </label>
        <textarea name="description" required rows={4} maxLength={2000}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm resize-none"
          placeholder={zh ? '详细描述失误经过、影响和后果' : 'Describe the incident in Chinese'} />
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">
          {zh ? '详细描述（英文）' : 'Description (English)'}
        </label>
        <textarea name="description_en" rows={3} maxLength={2000}
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm resize-none"
          placeholder={zh ? '英文描述（可选）' : 'English description (optional)'} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-prison-muted mb-1">
            {zh ? '罪行类型 *' : 'Category *'}
          </label>
          <select name="category" required
            className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
            <option value="">{zh ? '选择类型' : 'Select'}</option>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-prison-muted mb-1">
            {zh ? '严重程度 *' : 'Severity *'}
          </label>
          <select name="severity" required
            className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
            <option value="">{zh ? '选择等级' : 'Select'}</option>
            {severityLabels.map((label, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} — {label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-prison-muted mb-1">
          {zh ? '来源链接' : 'Source URL'}
        </label>
        <input name="source_url" type="url"
          className="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="https://..." />
      </div>

      {status === 'error' && (
        <div className="border border-prison-red text-prison-red text-xs px-3 py-2">
          {zh ? '错误: ' : 'Error: '}{errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="prison-btn-green w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">
        {status === 'loading'
          ? (zh ? '提交中...' : 'Submitting...')
          : (zh ? '提交案件' : 'Submit Case')}
      </button>
      <p className="text-prison-muted text-xs text-center">
        {zh ? '匿名提交 · 经审核后公开' : 'Anonymous · Published after review'}
      </p>
    </form>
  )
}
