import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'pictures-videos-harness'),
  server: {
    host: '127.0.0.1',
    port: 4312,
  },
})
