import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Явно задаём хост и порт
    host: 'localhost',
    port: 5173,
    // Фикс WebSocket HMR — клиент и сервер на одном хосте
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
})
