import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: path.resolve(__dirname, 'staff-list-harness'),
  plugins: [react()],
  preview: {
    allowedHosts: ['minsubao.localhome.cn'],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    watch: {
      ignored: ['**/artifacts/**', '**/test-results/**', '**/tmp/**', '**/docs/**'],
    },
  },
})
