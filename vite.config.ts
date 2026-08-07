import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    optimizeDeps: {
      entries: ['index.html'],
    },
    plugins: [
      react(), 
      tailwindcss()
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            'capacitor-vendor': ['@capacitor/core', '@capacitor/browser', '@capacitor/geolocation', '@capacitor/app', '@capacitor/haptics'],
            'ui-vendor': ['lucide-react', 'motion', 'framer-motion'],
            'map-vendor': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
            'chart-vendor': ['recharts'],
            'aws-vendor': ['@aws-sdk/client-s3'],
            'ai-vendor': ['@google/genai']
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
