import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const devProxyTarget = process.env.PMS_DEV_PROXY_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.mjs', '.mts', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  base: './', // 浣跨敤鐩稿璺緞锛岄€傞厤鍚勭閮ㄧ讲鍦烘櫙
  optimizeDeps: {
    noDiscovery: true,
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'],
  },
  server: {
    proxy: {
      '/api': {
        target: devProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
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
    sourcemap: false, // 鐢熶骇鐜閫氬父涓嶉渶瑕?sourcemap
  }
})

