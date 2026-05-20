import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.resolve(__dirname, 'auto-strategy-setting-harness')
const workspaceRoot = path.resolve(__dirname, '..')

export default defineConfig({
  root,
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4313,
    fs: {
      allow: [workspaceRoot],
    },
  },
})
