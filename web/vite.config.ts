import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Sous-dossier de publication (ex. /WildWeb/ sur GitHub Pages). « / » pour un domaine à soi.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // toujours la même adresse : pas de vieil onglet branché sur un ancien serveur
    // En dev, /api part vers l'API Go : pas de souci de CORS.
    // scripts/dev.mjs passe le port choisi dans WL_API_PORT.
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.WL_API_PORT ?? 8081}`, changeOrigin: true } },
  },
})
