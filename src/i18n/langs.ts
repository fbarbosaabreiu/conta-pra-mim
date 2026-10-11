// Idiomas do app. O português é o idioma nativo: é o fallback de qualquer texto sem tradução.

export const LANGS = ['pt', 'en', 'es', 'fr'] as const
export type Lang = (typeof LANGS)[number]

export const LANG_INFO: Record<Lang, { name: string; locale: string }> = {
  pt: { name: 'Português', locale: 'pt-BR' },
  en: { name: 'English', locale: 'en-US' },
  es: { name: 'Español', locale: 'es-ES' },
  fr: { name: 'Français', locale: 'fr-FR' },
}

export const isLang = (x: unknown): x is Lang => LANGS.includes(x as Lang)

/** Texto do conteúdo: uma string só (vale para todos, ex.: "1") ou uma por idioma. */
export type Text = string | Record<Lang, string>

/** Francês: espaço inseparável antes de ? ! : ; » e depois de «, para não quebrar a linha ali. */
export const frSpacing = (s: string) => s.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ')

export function tr(text: Text, lang: Lang): string {
  const s = typeof text === 'string' ? text : (text[lang] ?? text.pt)
  return lang === 'fr' ? frSpacing(s) : s
}
