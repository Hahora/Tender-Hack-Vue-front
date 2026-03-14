<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader    from './components/AppHeader.vue'
import AppSubHeader from './components/AppSubHeader.vue'

const router = useRouter()

const subHeaderRef   = ref(null)
const isRouteLoading = ref(false)
const isSearchOpen   = ref(false)

function onFocusSearch() {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    // Фокус после появления анимации
    setTimeout(() => subHeaderRef.value?.focusInput(), 50)
  }
}

function closeSearch() {
  isSearchOpen.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') closeSearch()
}

onMounted(()    => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

router.beforeEach(() => {
  isRouteLoading.value = true
  closeSearch()  // скрываем поиск при переходе на другую страницу
})
router.afterEach(()  => {
  setTimeout(() => { isRouteLoading.value = false }, 350)
})
</script>

<template>
  <div class="app-shell">

    <!-- Прогресс-бар переходов -->
    <div class="route-progress" :class="{ 'route-progress--active': isRouteLoading }" />

    <!-- Шапка -->
    <AppHeader @focus-search="onFocusSearch" />

    <!-- Подшапка с поиском (скрыта по умолчанию) -->
    <Transition name="subheader">
      <AppSubHeader v-if="isSearchOpen" ref="subHeaderRef" @close="closeSearch" />
    </Transition>

    <!-- Основной контент -->
    <main class="app-shell__main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
}

.app-shell__main {
  flex: 1;
}

/* ===== Прогресс-бар роутера ===== */
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: linear-gradient(90deg, var(--color-main-blue), var(--color-sea-clear));
  transform: scaleX(0);
  transform-origin: left center;
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}

.route-progress--active {
  opacity: 1;
  animation: route-loading 0.9s ease-in-out forwards;
}

@keyframes route-loading {
  0%   { transform: scaleX(0);   }
  60%  { transform: scaleX(0.75); }
  100% { transform: scaleX(0.92); }
}
</style>

<style>
/* Анимация выезда подшапки поиска */
.subheader-enter-active {
  transition: max-height 280ms ease, opacity 200ms ease;
  overflow: hidden;
  max-height: 120px;
}
.subheader-leave-active {
  transition: max-height 220ms ease, opacity 180ms ease;
  overflow: hidden;
}
.subheader-enter-from {
  max-height: 0;
  opacity: 0;
}
.subheader-leave-to {
  max-height: 0;
  opacity: 0;
}

.page-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.page-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
