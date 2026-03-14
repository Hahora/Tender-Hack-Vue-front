/**
 * Точка входа Vue-приложения
 * Подключаем: Vue, Pinia (стор), Vue Router, глобальные стили
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'

// Глобальные стили: переменные + базовые стили
import './assets/styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
