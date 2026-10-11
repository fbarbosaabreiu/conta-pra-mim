import { useSettings } from '../lib/settings'
import { ui } from './ui'

export * from './langs'

export function useLang() {
  return useSettings().lang
}

/** Textos da interface no idioma atual. */
export function useT() {
  return ui[useLang()]
}
