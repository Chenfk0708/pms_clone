import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: resolve(__dirname, 'smart-hotel-settings-harness'),
  plugins: [react()],
  preview: {
    allowedHosts: ['127.0.0.1', 'minsubao.localhome.cn'],
  },
})
