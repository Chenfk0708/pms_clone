import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: './tmp/months-drawer-harness',
  plugins: [react()],
  build: {
    outDir: '../months-drawer-dist',
    emptyOutDir: true,
  },
})
