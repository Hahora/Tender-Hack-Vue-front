import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    server: {
      host: true,
      port: 5173,
      allowedHosts: ['buoyantly-positive-prawn.cloudpub.ru'],
      // Проксируем /api и /auth на бэкенд, чтобы обойти CORS в dev-режиме
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
