// Faixas etárias que os pais escolhem. Ficam nas configurações (settings.age).

export const AGES = ['a0', 'a1', 'a2', 'a3'] as const
/** a0 = 0–1 ano, a1 = 1–2, a2 = 2–3, a3 = 3 anos ou mais. */
export type AgeId = (typeof AGES)[number]

export const isAge = (x: unknown): x is AgeId => AGES.includes(x as AgeId)
