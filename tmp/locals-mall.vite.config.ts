import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: path.resolve(__dirname, 'locals-mall-harness'),
  plugins: [react()],
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  preview: {
    allowedHosts: ['127.0.0.1', 'minsubao.localhome.cn'],
  },
})
