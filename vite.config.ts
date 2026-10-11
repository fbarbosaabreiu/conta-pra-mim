import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Caminhos relativos + HashRouter: funciona em qualquer hospedagem estática.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Fala Falinha',
        short_name: 'Fala Falinha',
        description: 'Histórias e brincadeiras para bebês aprenderem a falar.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#ffb703',
        background_color: '#fff8e7',
        // PNGs gerados por `npm run icons` (pwa-assets.config.ts) a partir de public/icon.svg.
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,webp,mp3}'],
      },
    }),
  ],
})
