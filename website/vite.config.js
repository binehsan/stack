import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
