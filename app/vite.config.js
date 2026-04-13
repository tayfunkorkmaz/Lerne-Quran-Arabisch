import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('quran-morphology-db.json')) return 'quran-morphology-db'
          if (id.includes('quran-rasm.json')) return 'quran-rasm'
          if (id.includes('quran-uthmani.json')) return 'quran-uthmani'
          if (id.includes('quran-vocalized.json')) return 'quran-vocalized'
          if (id.includes('root-frequency-complete.json')) return 'root-frequency-complete'
        },
      },
    },
  },
  css: {
    devSourcemap: true,
  },
  test: {
    environment: 'node',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
    environmentMatchGlobs: [
      ['src/**/*.render.test.*', 'jsdom'],
    ],
  },
})
