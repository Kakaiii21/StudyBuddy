import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'
        ],
      },
      manifest: {
        name: 'Study Buddy',
        short_name: 'StudyBuddy',
        theme_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        background_color: '#ffffff',
          icons: [
            { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
    }),
  ],
})