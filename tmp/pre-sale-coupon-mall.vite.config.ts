import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'pre-sale-coupon-mall-harness'),
})
