<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useCartStore } from '../stores/cartStore.js'
import { usePriceStore } from '../stores/priceStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { formatPrice } from '../composables/usePriceCalculation.js'

const router = useRouter()
const emit   = defineEmits(['focusSearch'])
const cart   = useCartStore()
const price  = usePriceStore()
const auth   = useAuthStore()

const isMobileMenuOpen = ref(false)
const showRegionDrop   = ref(false)
const regionSearch     = ref('')

const filteredRegions = computed(() => {
  const q = regionSearch.value.trim().toLowerCase()
  if (!q) return price.availableRegions
  return price.availableRegions.filter(r => r.toLowerCase().includes(q))
})

// Таймер — чтобы дроп региона не закрывался при переходе курсора на него
let regionTimer = null

function openRegion()  { clearTimeout(regionTimer); showRegionDrop.value  = true }
function closeRegion() { regionTimer = setTimeout(() => { showRegionDrop.value  = false; regionSearch.value = '' }, 180) }

function selectRegion(r) {
  price.userRegion      = r
  price.regionConfirmed = true
  showRegionDrop.value  = false
  regionSearch.value    = ''
}

const cartCount = computed(() => cart.items.length)

function goHome() {
  router.push({ name: 'home' })
}

function logout() {
  auth.logout()
  isMobileMenuOpen.value = false
  router.push('/login')
}
</script>

<template>
  <header class="header">
    <div class="container header__inner">

      <!-- Логотип -->
      <button class="header__logo" @click="goHome" aria-label="На главную">
        <img src="../assets/pp_logo.svg" alt="Портал Поставщиков" class="header__logo-img" />
      </button>

      <div class="header__spacer" />

      <!-- Иконки: при наведении выдвигается подпись вправо -->
      <div class="header__icons">

        <!-- Поиск -->
        <button class="header__icon-btn" aria-label="Поиск" @click="emit('focusSearch')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="header__icon-svg">
            <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.7"/>
            <path d="M13.5 13.5L18 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          <span class="header__icon-label">Поиск</span>
        </button>

        <!-- Выбор региона -->
        <div
          class="header__cart-wrap"
          @mouseenter="openRegion"
          @mouseleave="closeRegion"
        >
          <button
            class="header__icon-btn header__icon-btn--region"
            aria-label="Выбор региона"
            @click="showRegionDrop = !showRegionDrop"
          >
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" class="header__icon-svg">
              <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <circle cx="8" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/>
            </svg>
            <span v-if="price.regionDetecting" class="header__icon-label header__icon-label--region">…</span>
            <span v-else class="header__icon-label header__icon-label--region">{{ price.userRegion }}</span>
            <svg
              width="9" height="5" viewBox="0 0 9 5" fill="none"
              class="header__chevron"
              :style="showRegionDrop ? 'transform:rotate(180deg)' : ''"
            >
              <path d="M1 1l3.5 3L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <Transition name="cart-drop">
            <div v-if="showRegionDrop" class="header__cart-drop header__region-drop">
              <div class="header__cart-drop-head">
                <span class="header__cart-drop-title">Регион</span>
              </div>
              <div class="header__region-search-wrap">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" class="header__region-search-icon">
                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M9 9l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                <input
                  v-model="regionSearch"
                  class="header__region-search"
                  placeholder="Поиск региона…"
                  autocomplete="off"
                />
              </div>
              <div class="header__cart-drop-list">
                <p v-if="filteredRegions.length === 0" class="header__region-empty">Не найдено</p>
                <button
                  v-for="r in filteredRegions"
                  :key="r"
                  class="header__region-item"
                  :class="{ 'header__region-item--active': r === price.userRegion }"
                  @click="selectRegion(r)"
                >
                  <svg v-if="r === price.userRegion" width="12" height="12" viewBox="0 0 12 12" fill="none" class="header__region-check">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span v-else class="header__region-spacer" />
                  {{ r }}
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Корзина -->
        <div class="header__cart-wrap">
          <span v-if="cartCount > 0" class="header__cart-badge">{{ cartCount }}</span>
          <button
            class="header__icon-btn"
            :class="{ 'header__icon-btn--active': cartCount > 0 }"
            aria-label="Корзина"
            @click="router.push({ name: 'cart' })"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="header__icon-svg">
              <path d="M2 3h2.3l2.2 8.5h9.5l1.7-6H5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8.5" cy="16.5" r="1.4" fill="currentColor"/>
              <circle cx="14.5" cy="16.5" r="1.4" fill="currentColor"/>
            </svg>
            <span class="header__icon-label">Корзина</span>
          </button>
        </div>

        <!-- История закупок -->
        <button class="header__icon-btn" aria-label="История закупок" @click="router.push({ name: 'history' })">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="header__icon-svg">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.6"/>
            <path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="header__icon-label">История</span>
        </button>

        <!-- Выбор языка -->
        <button class="header__icon-btn header__icon-btn--lang" aria-label="Выбор языка">
          <span class="header__flag" aria-hidden="true">
            <svg width="22" height="16" viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg">
              <rect width="22" height="5.33" fill="#fff"/>
              <rect y="5.33" width="22" height="5.33" fill="#0039A6"/>
              <rect y="10.67" width="22" height="5.33" fill="#D52B1E"/>
            </svg>
          </span>
          <span class="header__icon-label header__icon-label--lang">Русский</span>
          <svg width="9" height="5" viewBox="0 0 9 5" fill="none" class="header__chevron">
            <path d="M1 1l3.5 3L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

      </div>

      <!-- Войти / Зарегистрироваться / Профиль -->
      <div class="header__auth">
        <template v-if="auth.isAuth">
          <div class="header__user">
            <div class="header__user-avatar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.4"/>
                <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="header__user-name">{{ auth.username }}</span>
          </div>
          <button class="header__btn-logout" @click="logout">Выйти</button>
        </template>
        <template v-else>
          <button class="header__btn-login" @click="router.push('/login')">Войти</button>
          <button class="header__btn-register">Зарегистрироваться</button>
        </template>
      </div>

      <!-- Мобильный бургер -->
      <button
        class="header__mobile-toggle"
        :aria-expanded="isMobileMenuOpen"
        aria-label="Открыть меню"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <svg
          class="header__burger-icon"
          width="22" height="16" viewBox="0 0 22 16" fill="none"
          :class="{ 'header__burger-icon--open': isMobileMenuOpen }"
        >
          <rect class="burger-line burger-line--1" y="0"  width="22" height="2" rx="1" fill="currentColor"/>
          <rect class="burger-line burger-line--2" y="7"  width="22" height="2" rx="1" fill="currentColor"/>
          <rect class="burger-line burger-line--3" y="14" width="22" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- Мобильное меню -->
    <Transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="header__mobile-menu">
        <div class="container">

          <!-- Профиль / Войти -->
          <div class="mob__user-row">
            <template v-if="auth.isAuth">
              <div class="mob__user-info">
                <div class="mob__user-avatar">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                </div>
                <span class="mob__user-name">{{ auth.username }}</span>
              </div>
              <button class="mob__btn mob__btn--logout" @click="logout">Выйти</button>
            </template>
            <template v-else>
              <button class="mob__btn mob__btn--login" @click="router.push('/login'); isMobileMenuOpen = false">Войти</button>
              <button class="mob__btn mob__btn--register">Зарегистрироваться</button>
            </template>
          </div>

          <div class="mob__divider" />

          <!-- Навигация -->
          <nav class="mob__nav">
            <button class="mob__nav-item" @click="emit('focusSearch'); isMobileMenuOpen = false">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.7"/><path d="M13.5 13.5L18 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              Поиск
            </button>
            <button class="mob__nav-item" @click="router.push({ name: 'cart' }); isMobileMenuOpen = false">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M2 3h2.3l2.2 8.5h9.5l1.7-6H5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="16.5" r="1.4" fill="currentColor"/><circle cx="14.5" cy="16.5" r="1.4" fill="currentColor"/></svg>
              Корзина
              <span v-if="cartCount > 0" class="mob__badge">{{ cartCount }}</span>
            </button>
            <button class="mob__nav-item" @click="router.push({ name: 'history' }); isMobileMenuOpen = false">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              История закупок
            </button>
          </nav>

          <div class="mob__divider" />

          <!-- Регион -->
          <div class="mob__region-row">
            <svg width="14" height="16" viewBox="0 0 16 18" fill="none"><path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
            <span class="mob__region-label">Регион:</span>
            <span class="mob__region-value">{{ price.userRegion }}</span>
          </div>
          <div class="mob__region-search-wrap">
            <input v-model="regionSearch" class="mob__region-input" placeholder="Поиск региона…" autocomplete="off" />
          </div>
          <div class="mob__region-list">
            <button
              v-for="r in filteredRegions.slice(0, regionSearch ? 999 : 5)"
              :key="r"
              class="mob__region-item"
              :class="{ 'mob__region-item--active': r === price.userRegion }"
              @click="selectRegion(r); isMobileMenuOpen = false"
            >{{ r }}</button>
            <p v-if="!regionSearch && price.availableRegions.length > 5" class="mob__region-more">Введите название для поиска…</p>
          </div>

        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 200;
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-gray-blue);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.header__inner {
  display: flex;
  align-items: center;
  height: 60px;
  gap: var(--space-3);
}

/* --- Логотип --- */
.header__logo {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.header__logo-img {
  height: 38px;
  width: auto;
  display: block;
}

.header__spacer { flex: 1; }

/* ===== Иконки с expand-анимацией ===== */
.header__icons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.header__icon-btn {
  display: flex;
  align-items: center;
  height: 36px;
  min-width: 36px;
  padding: 0 8px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-full);
  color: #5a6474;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    padding var(--transition-base);
  overflow: hidden;
  white-space: nowrap;
}

.header__icon-svg {
  flex-shrink: 0;
}

/* Скрытая подпись — выдвигается при hover */
.header__icon-label {
  display: inline-block;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  transition:
    max-width 250ms ease,
    opacity 200ms ease,
    margin-left 250ms ease;
  margin-left: 0;
  pointer-events: none;
}

.header__icon-btn:hover {
  background-color: var(--color-pale-blue);
  color: var(--color-main-blue);
}

.header__icon-btn:hover .header__icon-label {
  max-width: 100px;
  opacity: 1;
  margin-left: 6px;
}

/* Регион — иконка + chevron вправо */
.header__icon-btn--region {
  gap: 4px;
  padding: 0 8px;
}

/* Язык — флаг + chevron вниз */
.header__icon-btn--lang {
  gap: 4px;
  padding: 0 8px;
}

.header__flag {
  display: inline-flex;
  align-items: center;
  border-radius: 2px;
  overflow: hidden;
  width: 22px;
  height: 16px;
  flex-shrink: 0;
}

.header__chevron {
  flex-shrink: 0;
  color: #5a6474;
  transition: color var(--transition-fast), transform var(--transition-fast);
}


.header__icon-btn--region:hover .header__chevron,
.header__icon-btn--lang:hover .header__chevron {
  color: var(--color-main-blue);
}


/* --- Auth --- */
.header__auth {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  margin-left: var(--space-2);
}

.header__btn-login {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 7px 14px;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-fast);
  white-space: nowrap;
}

.header__btn-login:hover {
  background-color: var(--color-pale-blue);
}

.header__btn-register {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background-color: var(--color-red);
  border: none;
  cursor: pointer;
  padding: 7px 16px;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-fast);
  white-space: nowrap;
}

.header__btn-register:hover {
  background-color: #b82219;
}

/* --- User block --- */
.header__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 8px;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
}

.header__user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-main-blue);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header__user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  white-space: nowrap;
}

.header__btn-logout {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: none;
  border: 1px solid var(--color-gray-blue);
  cursor: pointer;
  padding: 6px 14px;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}

.header__btn-logout:hover {
  background-color: #fff0f0;
  border-color: var(--color-red);
  color: var(--color-red);
}

/* --- Корзина --- */
.header__cart-wrap {
  position: relative;
}

/* Невидимый мост между кнопкой и дропом (закрывает 8px зазор) */
.header__cart-wrap::after {
  content: '';
  position: absolute;
  top: 100%;
  left: -10px;
  right: -10px;
  height: 10px;
  pointer-events: auto;
}

.header__cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  background: var(--color-red);
  color: #fff;
  font-size: 9px;
  font-weight: var(--font-weight-bold);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
  z-index: 1;
}

.header__icon-btn--active {
  color: var(--color-main-blue);
}

/* Дроп-превью корзины */
.header__cart-drop {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 300;
  overflow: hidden;
}

.header__cart-drop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--color-pale-blue);
  border-bottom: 1px solid var(--color-gray-blue);
}

.header__cart-drop-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.header__cart-drop-count {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.header__cart-drop-list {
  padding: var(--space-1) 0;
  max-height: 200px;
  overflow-y: auto;
}

.header__cart-drop-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  transition: background var(--transition-fast);
}
.header__cart-drop-item:hover { background: var(--color-pale-blue); }

.header__cart-drop-name {
  font-size: var(--font-size-xs);
  color: var(--color-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.header__cart-drop-price {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  white-space: nowrap;
  flex-shrink: 0;
}

.header__cart-drop-more {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: var(--space-1) var(--space-3);
}

.header__cart-drop-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-gray-blue);
  background: #fafbfd;
}

.header__cart-drop-total {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.header__cart-drop-btn {
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-main-blue);
  border: none;
  border-radius: var(--radius-base);
  padding: 4px 12px;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.header__cart-drop-btn:hover { background: #1a3a6e; }

/* Анимация дропа */
.cart-drop-enter-active, .cart-drop-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.cart-drop-enter-from, .cart-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* --- Дроп региона --- */
.header__region-drop {
  width: 260px;
}

.header__region-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--space-3);
  border-bottom: 1px solid var(--color-gray-blue);
}

.header__region-search-icon {
  color: var(--color-pale-black);
  flex-shrink: 0;
}

.header__region-search {
  flex: 1;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  background: none;
  border: none;
  outline: none;
  padding: 0;
}
.header__region-search::placeholder { color: var(--color-pale-black); }

.header__region-empty {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: var(--space-3);
  text-align: center;
}

.header__region-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  text-align: left;
  transition: background var(--transition-fast);
  white-space: nowrap;
}
.header__region-item:hover { background: var(--color-pale-blue); }
.header__region-item--active {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.header__region-check { color: var(--color-main-blue); flex-shrink: 0; }
.header__region-spacer { display: inline-block; width: 12px; flex-shrink: 0; }

/* --- История поиска --- */
.header__history-drop {
  width: 260px;
}

.header__history-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  text-align: left;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--color-gray-blue);
}
.header__history-item:last-child { border-bottom: none; }
.header__history-item:hover { background: var(--color-pale-blue); }

.header__history-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 2px;
}

.header__history-date {
  font-size: 10px;
  color: var(--color-pale-black);
}

.header__history-total {
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  white-space: nowrap;
  font-size: var(--font-size-xs);
}

.header__history-names {
  font-size: 10px;
  color: var(--color-pale-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- Мобильный бургер --- */
.header__mobile-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #5a6474;
  padding: 8px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

/* --- Мобильное меню --- */
.header__mobile-menu {
  background: #fff;
  border-top: 1px solid var(--color-gray-blue);
  padding: var(--space-4) 0 var(--space-6);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

/* Анимация меню */
.mobile-menu-enter-active { transition: opacity 200ms ease, transform 200ms ease; }
.mobile-menu-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.mobile-menu-enter-from   { opacity: 0; transform: translateY(-8px); }
.mobile-menu-leave-to     { opacity: 0; transform: translateY(-8px); }

/* Пользователь */
.mob__user-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
}

.mob__user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.mob__user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-main-blue);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mob__user-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.mob__btn {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-base);
  padding: 8px 16px;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: background var(--transition-fast);
}

.mob__btn--login {
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
}
.mob__btn--login:hover { background: #dce8f5; }

.mob__btn--register {
  color: #fff;
  background: var(--color-red);
}
.mob__btn--register:hover { background: #b82219; }

.mob__btn--logout {
  color: var(--color-pale-black);
  background: none;
  border: 1px solid var(--color-gray-blue);
}
.mob__btn--logout:hover { background: #fff0f0; color: var(--color-red); border-color: var(--color-red); }

/* Разделитель */
.mob__divider {
  height: 1px;
  background: var(--color-gray-blue);
  margin: var(--space-2) 0;
}

/* Навигация */
.mob__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) 0;
}

.mob__nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: var(--radius-base);
  text-align: left;
  width: 100%;
  transition: background var(--transition-fast);
  position: relative;
}
.mob__nav-item:hover { background: var(--color-pale-blue); color: var(--color-main-blue); }

.mob__badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  background: var(--color-red);
  color: #fff;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

/* Регион */
.mob__region-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-3) 0 var(--space-2);
  color: var(--color-main-blue);
}

.mob__region-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.mob__region-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
}

.mob__region-search-wrap {
  margin-bottom: var(--space-2);
}

.mob__region-input {
  width: 100%;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 7px 12px;
  outline: none;
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}
.mob__region-input:focus { border-color: var(--color-main-blue); }
.mob__region-input::placeholder { color: var(--color-pale-black); }

.mob__region-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 180px;
  overflow-y: auto;
}

.mob__region-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-base);
  transition: background var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mob__region-item:hover { background: var(--color-pale-blue); }
.mob__region-item--active { color: var(--color-main-blue); font-weight: var(--font-weight-semibold); background: var(--color-pale-blue); }

.mob__region-more {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 6px 12px;
}

@media (max-width: 900px) {
  .header__icons,
  .header__auth { display: none; }
  .header__mobile-toggle { display: flex; }
}

@media (max-width: 480px) {
  .header__logo-img { height: 30px; }
}
</style>
