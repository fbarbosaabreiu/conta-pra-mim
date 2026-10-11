// Guarda se a pessoa já viu (ou pulou) o "Como usar" da primeira abertura.

const KEY = 'fala-falinha:onboarding-done'

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    // sem armazenamento (aba privada etc.): não insiste em mostrar o tutorial
    return true
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // sem armazenamento: vale só para esta sessão
  }
}
