import zh from './zh'
import en from './en'

export type Lang = 'zh' | 'en'
export type Translations = typeof zh

export const languages: Record<Lang, string> = {
  zh: '中文',
  en: 'English',
}

export const defaultLang: Lang = 'zh'

const translations: Record<Lang, Translations> = { zh, en }

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/')
  if (first === 'en') return 'en'
  return defaultLang
}

export function useTranslations(lang: Lang) {
  return translations[lang]
}

/** Build the alternate-language URL for a given path */
export function getAltLangUrl(lang: Lang, pathname: string): string {
  if (lang === 'zh') {
    // current is zh (no prefix), switch to /en/...
    return '/en' + pathname
  } else {
    // current is en (/en/...), strip the /en prefix
    return pathname.replace(/^\/en/, '') || '/'
  }
}

/** Strip the lang prefix to get the bare path (for building links) */
export function getPathWithoutLang(pathname: string): string {
  return pathname.replace(/^\/en/, '') || '/'
}

/** Get severity label for given lang */
export function getSeverityLabel(lang: Lang, severity: number): { label: string; color: string } {
  const t = translations[lang]
  const colors: Record<number, string> = {
    1: 'text-yellow-400',
    2: 'text-orange-400',
    3: 'text-orange-500',
    4: 'text-red-500',
    5: 'text-red-600',
  }
  const key = `severity_${severity}` as keyof Translations
  return {
    label: t[key] as string,
    color: colors[severity] ?? 'text-prison-muted',
  }
}

/** All known category keys */
export const CATEGORY_KEYS = ['hallucination', 'bias', 'safety', 'privacy', 'other'] as const

/** Get category label for given lang */
export function getCategoryLabel(lang: Lang, category: string): string {
  const t = translations[lang]
  const key = `category_${category}` as keyof Translations
  return (t[key] as string) ?? category
}
