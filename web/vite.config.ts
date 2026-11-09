import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En dev, /api part vers l'API Go : pas de souci de CORS.
    proxy: { '/api': { target: 'http://127.0.0.1:8081', changeOrigin: true } },
  },
})
