// "Indicar para outra família": abre a folha de compartilhar do aparelho (WhatsApp, Telegram…)
// ou, onde ela não existe (computador), o WhatsApp Web. O link leva a marca ?origem=indicacao.

import type { Lang } from '../i18n'
import { track } from './analytics'

export const SHARE_URL = 'https://falafalinha.com/?origem=indicacao'

const TEXT: Record<Lang, string> = {
  pt: 'Olha que legal este app para bebês aprenderem a falar: histórias com sons de bichos, cores e números, em 4 idiomas. É grátis e funciona no celular 👶🐮',
  en: 'Check out this app that helps babies learn to talk: stories with animal sounds, colors and numbers, in 4 languages. It’s free and works on your phone 👶🐮',
  es: 'Mira esta app para que los bebés aprendan a hablar: cuentos con sonidos de animales, colores y números, en 4 idiomas. Es gratis y funciona en el celular 👶🐮',
  fr: 'Regarde cette appli pour aider les bébés à parler : histoires avec des cris d’animaux, couleurs et chiffres, en 4 langues. C’est gratuit et ça marche sur le téléphone 👶🐮',
}

/** Retorna `false` se a pessoa cancelou. */
export async function shareApp(lang: Lang): Promise<boolean> {
  const text = TEXT[lang]
  track('share')
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Fala Falinha', text, url: SHARE_URL })
      return true
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return false
      // outro erro (ex.: sem permissão): cai no WhatsApp
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${SHARE_URL}`)}`, '_blank', 'noopener')
  return true
}
