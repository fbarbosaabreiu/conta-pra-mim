import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Gera os PNGs (ícone da tela de início do iPhone, Android, favicon) a partir de public/icon.svg.
// Fundo amarelo sem margem: o iOS e o Android já arredondam os cantos sozinhos.
const background = '#ffb703'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ['public/icon.svg'],
})
