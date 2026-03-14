<script setup>
import { ref, computed } from 'vue'
import { usePriceStore } from '../stores/priceStore.js'

const store = usePriceStore()

const showDrop  = ref(false)
const search    = ref('')

const filteredRegions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.availableRegions
  return store.availableRegions.filter(r => r.toLowerCase().includes(q))
})

function confirm() {
  store.regionConfirmed = true
  localStorage.setItem('regionConfirmed', 'true')
}

function selectRegion(region) {
  store.userRegion      = region
  store.regionConfirmed = true
  showDrop.value        = false
  search.value          = ''
  localStorage.setItem('userRegion',      region)
  localStorage.setItem('regionConfirmed', 'true')
}

function toggleDrop() {
  showDrop.value = !showDrop.value
  if (!showDrop.value) search.value = ''
}

function onBlur(e) {
  // Закрываем если фокус ушёл за пределы компонента
  if (!e.currentTarget.contains(e.relatedTarget)) {
    showDrop.value = false
    search.value   = ''
  }
}
</script>

<template>
  <Transition name="region-banner">
    <div v-if="store.regionDetected && !store.regionConfirmed" class="rb">
      <div class="container rb__inner">
        <svg class="rb__pin" width="16" height="18" viewBox="0 0 16 18" fill="none">
          <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="8" cy="6" r="2" stroke="currentColor" stroke-width="1.3"/>
        </svg>

        <span class="rb__text">
          Ваш регион —
          <strong class="rb__region">{{ store.detectedRegion || store.userRegion }}</strong>?
        </span>

        <div class="rb__actions">
          <button class="rb__btn rb__btn--confirm" @click="confirm">
            Да, верно
          </button>
          <div class="rb__sep" />
          <span class="rb__or">или выберите:</span>

          <!-- Кастомный дроп с поиском -->
          <div class="rb__drop-wrap" @blur.capture="onBlur" tabindex="-1">
            <button class="rb__drop-trigger" @click="toggleDrop">
              Регион из списка
              <svg width="9" height="5" viewBox="0 0 9 5" fill="none" class="rb__drop-chevron" :style="showDrop ? 'transform:rotate(180deg)' : ''">
                <path d="M1 1l3.5 3L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div v-if="showDrop" class="rb__drop">
              <div class="rb__drop-search-wrap">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="rb__drop-search-icon">
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M8 8l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <input
                  v-model="search"
                  class="rb__drop-search"
                  placeholder="Поиск…"
                  autocomplete="off"
                />
              </div>
              <div class="rb__drop-list">
                <p v-if="filteredRegions.length === 0" class="rb__drop-empty">Не найдено</p>
                <button
                  v-for="r in filteredRegions"
                  :key="r"
                  class="rb__drop-item"
                  :class="{ 'rb__drop-item--active': r === store.userRegion }"
                  @click="selectRegion(r)"
                >{{ r }}</button>
              </div>
            </div>
          </div>
        </div>

        <button class="rb__close" @click="confirm" aria-label="Закрыть">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.rb {
  background: #fff;
  border-bottom: 1px solid var(--color-gray-blue);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: sticky;
  top: 60px;   /* прилипает сразу под хедером (высота хедера 60px) */
  z-index: 199;
}

.rb__inner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  flex-wrap: nowrap;
}

.rb__pin {
  color: var(--color-main-blue);
  flex-shrink: 0;
}

.rb__text {
  font-size: var(--font-size-sm);
  color: var(--color-black);
  white-space: nowrap;
}

.rb__region {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-bold);
}

.rb__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: var(--space-1);
}

.rb__btn--confirm {
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-main-blue);
  border: none;
  border-radius: var(--radius-base);
  padding: 4px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
}
.rb__btn--confirm:hover { background: #1a3a6e; }

.rb__sep {
  width: 1px;
  height: 16px;
  background: var(--color-gray-blue);
  flex-shrink: 0;
}

.rb__or {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  white-space: nowrap;
}

/* --- Кастомный дроп --- */
.rb__drop-wrap {
  position: relative;
  flex-shrink: 0;
  outline: none;
}

.rb__drop-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--transition-fast);
}
.rb__drop-trigger:hover { border-color: var(--color-main-blue); }

.rb__drop-chevron {
  color: var(--color-pale-black);
  transition: transform var(--transition-fast);
}

.rb__drop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 240px;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 400;
  overflow: hidden;
}

.rb__drop-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--color-gray-blue);
}

.rb__drop-search-icon {
  color: var(--color-pale-black);
  flex-shrink: 0;
}

.rb__drop-search {
  flex: 1;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  background: none;
  border: none;
  outline: none;
  padding: 0;
}
.rb__drop-search::placeholder { color: var(--color-pale-black); }

.rb__drop-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}

.rb__drop-empty {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 10px;
  text-align: center;
}

.rb__drop-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rb__drop-item:hover { background: var(--color-pale-blue); }
.rb__drop-item--active {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
  background: var(--color-pale-blue);
}

.rb__close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-pale-black);
  border-radius: var(--radius-base);
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.rb__close:hover { background: var(--color-pale-blue); color: var(--color-black); }

/* Анимация */
.region-banner-enter-active {
  transition: max-height 300ms ease, opacity 250ms ease;
  overflow: hidden;
  max-height: 120px;
}
.region-banner-leave-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  overflow: hidden;
}
.region-banner-enter-from { max-height: 0; opacity: 0; }
.region-banner-leave-to   { max-height: 0; opacity: 0; }

/* === Мобильная адаптация: модальное окно === */
@media (max-width: 700px) {
  /* Оверлей на весь экран */
  .rb {
    position: fixed;
    inset: 0;
    top: 0 !important;
    background: rgba(0, 0, 0, 0.45);
    border-bottom: none;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    z-index: 600;
  }

  /* Карточка по центру */
  .rb__inner {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
    padding: var(--space-6) var(--space-5) var(--space-5);
    min-height: auto;
    background: #fff;
    border-radius: var(--radius-lg);
    box-shadow: 0 16px 48px rgba(0,0,0,0.22);
    width: 100%;
    max-width: 360px;
    position: relative;
  }

  .rb__pin {
    display: block;
    margin: 0 auto;
  }

  .rb__text {
    font-size: var(--font-size-base);
    white-space: normal;
    text-align: center;
  }

  /* Крестик — в правом верхнем углу карточки */
  .rb__close {
    position: absolute;
    top: 12px;
    right: 12px;
    margin-left: 0;
  }

  /* Действия — колонкой */
  .rb__actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    margin-left: 0;
    width: 100%;
  }

  .rb__sep { display: none; }

  .rb__or {
    text-align: center;
    font-size: var(--font-size-xs);
  }

  .rb__btn--confirm {
    width: 100%;
    padding: 11px 12px;
    font-size: var(--font-size-base);
    text-align: center;
  }

  .rb__drop-wrap { width: 100%; }

  .rb__drop-trigger {
    width: 100%;
    justify-content: space-between;
    padding: 9px 12px;
    font-size: var(--font-size-base);
  }

  .rb__drop {
    left: 0;
    right: 0;
    width: auto;
  }
}
</style>
