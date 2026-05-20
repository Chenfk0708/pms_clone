import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'],
  },
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/components/AppShell.tsx',
        './src/pages/ImSettingPage.tsx',
        './src/pages/ImSettingPage.css',
        './src/services/imSetting.ts',
      ],
    },
  },
  preview: {
    allowedHosts: ['minsubao.localhome.cn'],
  },
})
