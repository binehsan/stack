import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Makes "desktop app access" real: this emits a web manifest + service
    // worker so Chrome/Edge offer an "Install app" affordance that launches
    // Stack as a standalone window. Colors below
    // are the same tokens src/index.css defines (`--gradient-3` /
    // `--gradient-1`), not guesses.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Stack',
        short_name: 'Stack',
        description: 'Your tasks, together.',
        display: 'standalone',
        start_url: '/dashboard',
        theme_color: '#583714',
        background_color: '#583714',
        // Not marked `purpose: 'maskable'` — the source mark isn't padded
        // with a safe zone, so claiming maskable would risk a bad crop on
        // platforms that honor it. These are plain 'any' icons, which is
        // what the desktop install prompt (the actual target here) uses.
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Lets the web app call fetch('/api/...') in dev without hardcoding a
      // host/port — mirrors how the mobile app points at the Django backend,
      // but avoids baking a LAN IP into the web build. Production deploys
      // set VITE_API_BASE_URL instead (see src/api/config.js).
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
