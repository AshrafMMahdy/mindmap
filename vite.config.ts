import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' keeps asset paths relative so the same build works when served
// from a localhost static server, opened by Electron (loadFile), or hosted on
// a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
