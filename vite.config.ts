import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，适配各种部署场景
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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境通常不需要 sourcemap
  }
})
