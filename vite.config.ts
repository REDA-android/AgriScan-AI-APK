import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    optimizeDeps: {
      entries: ['index.html'],
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon.svg', 'assets/**/*'],
        manifest: {
          id: '/',
          name: 'AgriScan AI - Diagnostic Agricole',
          short_name: 'AgriScan AI',
          description: 'Diagnostic phytosanitaire par IA, météo agricole 7 jours, calendrier des récoltes et cours des marchés.',
          theme_color: '#059669',
          background_color: '#06130d',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB limit for precaching
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'weather-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 30, // 30 mins
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'capacitor-vendor': ['@capacitor/core', '@capacitor/browser', '@capacitor/geolocation', '@capacitor/app', '@capacitor/haptics'],
            'ui-vendor': ['lucide-react', 'motion'],
            'map-vendor': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
            'chart-vendor': ['recharts'],
            'pdf-vendor': ['jspdf'],
            'aws-vendor': ['@aws-sdk/client-s3'],
            'ai-vendor': ['@google/genai'],
            'xlsx-vendor': ['xlsx'],
            'html2canvas-vendor': ['html2canvas'],
            'dompurify-vendor': ['dompurify']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
  };
});
