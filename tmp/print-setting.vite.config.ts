import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'print-setting-harness'),
  build: {
    outDir: path.resolve(__dirname, 'print-setting-build'),
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 4313,
  },
})
