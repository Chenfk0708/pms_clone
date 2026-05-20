import { defineConfig, mergeConfig } from 'vite'
import baseConfig from '../vite.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      outDir: 'tmp/notification-setting-dist',
      emptyOutDir: true,
    },
    server: {
      hmr: false,
      watch: {
        ignored: ['**/artifacts/**', '**/tmp/**', '**/test-results/**', '**/.tmp/**', '**/playwright-report/**'],
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4317,
    },
  }),
)
