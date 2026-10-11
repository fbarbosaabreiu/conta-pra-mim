import type { Story } from '../../types'
import fazenda from './fazenda.json'
import arcoIris from './arco-iris.json'
import patinhos from './patinhos.json'

// Para adicionar uma história: crie o JSON nesta pasta e inclua-o aqui.
export const stories: Story[] = [fazenda, arcoIris, patinhos]

export function getStory(id: string | undefined): Story | undefined {
  return stories.find((s) => s.id === id)
}
