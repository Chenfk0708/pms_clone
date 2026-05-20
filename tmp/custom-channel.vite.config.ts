import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'custom-channel-harness'),
  server: {
    host: '127.0.0.1',
    port: 4347,
  },
  preview: {
    host: '127.0.0.1',
    port: 4347,
  },
})
