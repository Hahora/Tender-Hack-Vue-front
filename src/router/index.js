/**
 * Маршрутизатор Vue Router
 * Три страницы: главная, результаты, документ
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Расчёт НМЦ — Главная' },
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('../views/ResultsView.vue'),
    meta: { title: 'Результаты поиска' },
  },
  {
    path: '/document',
    name: 'document',
    component: () => import('../views/DocumentView.vue'),
    meta: { title: 'Обоснование НМЦ' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Вход — Портал Поставщиков' },
  },
  {
    path: '/procurement/:id',
    name: 'procurement-detail',
    component: () => import('../views/ProcurementDetailView.vue'),
    meta: { title: 'Детали закупки' },
  },
  {
    path: '/contracts',
    name: 'contracts',
    component: () => import('../views/ContractListView.vue'),
    meta: { title: 'Контракты' },
  },
  {
    path: '/ste/:id',
    name: 'ste-detail',
    component: () => import('../views/SteDetailView.vue'),
    meta: { title: 'Детали СТЕ' },
  },
  {
    path: '/contract/:number',
    name: 'contract-detail',
    component: () => import('../views/ContractDetailView.vue'),
    meta: { title: 'Контракт' },
  },
  // Редирект с любого несуществующего пути на главную
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Защита маршрутов: не авторизован — на /login
router.beforeEach((to) => {
  const isAuth = localStorage.getItem('isAuth') === 'true'
  if (!isAuth && to.name !== 'login') {
    return { name: 'login' }
  }
  if (isAuth && to.name === 'login') {
    return { name: 'home' }
  }
})

// Обновляем заголовок вкладки
router.afterEach(to => {
  document.title = to.meta.title ?? 'Расчёт НМЦ'
})

export default router
