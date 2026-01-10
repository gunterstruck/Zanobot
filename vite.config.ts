import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@data': path.resolve(__dirname, './src/data'),
      '@ui': path.resolve(__dirname, './src/ui'),
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'assets/**/*'],
      manifest: {
        name: 'Zanobot - AI Assistant',
        short_name: 'Zanobot',
        description: 'Industrial Machine Diagnostics using Acoustic Analysis',
        theme_color: '#0A1929',
        background_color: '#0A1929',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'dsp': ['./src/core/dsp/fft.ts', './src/core/dsp/features.ts'],
          'ml': ['./src/core/ml/gmia.ts', './src/core/ml/scoring.ts', './src/core/ml/mathUtils.ts']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: false,
    open: true
  }
});
