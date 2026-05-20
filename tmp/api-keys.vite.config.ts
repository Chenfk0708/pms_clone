import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'api-keys-harness'),
  server: {
    host: '127.0.0.1',
    port: 4305,
  },
})
