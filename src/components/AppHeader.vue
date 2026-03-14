<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const emit = defineEmits(['focusSearch'])

const isMobileMenuOpen = ref(false)

function goHome() {
  router.push('/')
}

function goLogin() {
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

        <button class="header__icon-btn" aria-label="Поиск" @click="emit('focusSearch')">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="header__icon-svg">
            <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.7"/>
            <path d="M13.5 13.5L18 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          <span class="header__icon-label">Поиск</span>
        </button>

        <!-- Выбор региона -->
        <button class="header__icon-btn header__icon-btn--region" aria-label="Выбор региона">
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none" class="header__icon-svg">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <circle cx="8" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/>
          </svg>
          <span class="header__icon-label header__icon-label--region">Москва</span>
          <svg width="9" height="5" viewBox="0 0 9 5" fill="none" class="header__chevron">
            <path d="M1 1l3.5 3L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button class="header__icon-btn" aria-label="Корзина">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="header__icon-svg">
            <path d="M2 3h2.3l2.2 8.5h9.5l1.7-6H5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8.5" cy="16.5" r="1.4" fill="currentColor"/>
            <circle cx="14.5" cy="16.5" r="1.4" fill="currentColor"/>
          </svg>
          <span class="header__icon-label">Корзина</span>
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

      <!-- Войти / Зарегистрироваться -->
      <div class="header__auth">
        <button class="header__btn-login" @click="goLogin">Войти</button>
        <button class="header__btn-register">Зарегистрироваться</button>
      </div>

      <!-- Мобильный бургер -->
      <button
        class="header__mobile-toggle"
        :aria-expanded="isMobileMenuOpen"
        aria-label="Открыть меню"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <rect y="0"  width="22" height="2" rx="1" fill="currentColor"/>
          <rect y="7"  width="22" height="2" rx="1" fill="currentColor"/>
          <rect y="14" width="22" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <!-- Мобильное меню -->
    <div v-if="isMobileMenuOpen" class="header__mobile-menu">
      <div class="container">
        <nav class="header__mobile-nav">
          <button class="header__mobile-nav-item" @click="emit('focusSearch'); isMobileMenuOpen = false">Поиск</button>
          <button class="header__mobile-nav-item">Корзина</button>
          <button class="header__mobile-nav-item">Московская область</button>
          <button class="header__mobile-nav-item" @click="goLogin(); isMobileMenuOpen = false">Войти</button>
          <button class="header__mobile-nav-item header__mobile-nav-item--register">Зарегистрироваться</button>
        </nav>
      </div>
    </div>
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
  transition: color var(--transition-fast);
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

/* --- Мобильный --- */
.header__mobile-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #5a6474;
  padding: 8px;
  flex-shrink: 0;
}

.header__mobile-menu {
  background-color: #fff;
  border-top: 1px solid var(--color-gray-blue);
  padding: var(--space-4) 0;
}

.header__mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header__mobile-nav-item {
  display: flex;
  align-items: center;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px var(--space-2);
  border-radius: var(--radius-base);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.header__mobile-nav-item:hover {
  background-color: var(--color-pale-blue);
}

.header__mobile-nav-item--register {
  color: var(--color-red);
  font-weight: var(--font-weight-semibold);
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
