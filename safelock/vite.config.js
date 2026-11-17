import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [preact(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icons/*', 'samples/*'],
    manifest: {
      name: 'Safelock — Órdenes de campo', short_name: 'Safelock', description: 'Gestión de órdenes de campo para cuadrillas eléctricas',
      lang: 'es', start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', background_color: '#0E1B2C', theme_color: '#0E1B2C',
      categories: ['business', 'productivity'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,svg,png,json,pdf,woff2,mjs}'],
      navigateFallback: '/index.html',
      runtimeCaching: [
        { urlPattern: /^https:\/\/[a-c]?\.?tile\.openstreetmap\.org\/.*/i, handler: 'CacheFirst', options: { cacheName: 'osm-tiles', expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [0, 200] } } },
        { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts', cacheableResponse: { statuses: [0, 200] } } },
      ],
    },
  })],
  build: { chunkSizeWarningLimit: 1200 },
});
