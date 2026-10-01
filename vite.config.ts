import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Rend l'appli installable sur Android (et iOS/desktop) : icône
    // sur l'écran d'accueil, plein écran, fonctionne hors-ligne une fois
    // visitée une première fois (les données vivent dans IndexedDB, sur
    // l'appareil). Nécessite d'être servie en HTTPS (ou localhost).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: 'Lignée Jardin — le carnet de bord du potager',
        short_name: 'Lignée Jardin',
        description:
          "Carnet de bord hors-ligne du potager : plantes et planches, journal photo, besoins NPK par stade, bilan hydrique, plan du jardin, tâches du jour.",
        lang: 'fr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#152218',
        theme_color: '#152218',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App 100% statique après le build : tout précacher au premier
        // chargement pour un fonctionnement hors-ligne complet ensuite.
        // Les données du jardin vivent dans IndexedDB (jamais en cache).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
