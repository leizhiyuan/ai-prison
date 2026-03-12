const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787'

export interface Case {
  id: string; model_id: string; title: string; title_en: string
  description: string; description_en: string; category: string
  severity: number; source_url?: string; status: string; created_at: number
  model_name: string; model_name_en: string; provider: string
}

export interface Model {
  id: string; name: string; name_en: string; provider: string
  incident_count: number; severity_score: number
}

export interface RankingModel extends Model {
  total_cases: number; total_severity: number; life_sentences: number
}

export async function getCases(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`${API_URL}/api/cases${qs}`)
  return res.json() as Promise<{ cases: Case[]; total: number; page: number; limit: number }>
}

export async function getCase(id: string) {
  const res = await fetch(`${API_URL}/api/cases/${id}`)
  if (!res.ok) return null
  return res.json() as Promise<Case>
}

export async function getRankings() {
  const res = await fetch(`${API_URL}/api/rankings`)
  return res.json() as Promise<RankingModel[]>
}

export async function getModels() {
  const res = await fetch(`${API_URL}/api/models`)
  return res.json() as Promise<Model[]>
}

export const SEVERITY_LABELS: Record<number, { zh: string; en: string; color: string }> = {
  1: { zh: '⚠️ 警告', en: 'Warning', color: 'text-yellow-400' },
  2: { zh: '🔒 拘留', en: 'Detention', color: 'text-orange-400' },
  3: { zh: '⛓️ 有期', en: 'Fixed Term', color: 'text-orange-500' },
  4: { zh: '🔴 重刑', en: 'Heavy', color: 'text-red-500' },
  5: { zh: '☠️ 无期', en: 'Life', color: 'text-red-600' },
}

export const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  hallucination: { zh: '幻觉', en: 'Hallucination' },
  bias: { zh: '偏见', en: 'Bias' },
  safety: { zh: '安全风险', en: 'Safety Risk' },
  privacy: { zh: '隐私泄露', en: 'Privacy Leak' },
  other: { zh: '其他', en: 'Other' },
}
