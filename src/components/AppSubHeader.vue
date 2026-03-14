<script setup>
/**
 * Подшапка — строка поиска по каталогу.
 * Показывает «Каталог продукции», поисковое поле, кнопку поиска и «Строгое соответствие».
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceStore } from '../stores/priceStore.js'

const router = useRouter()
const store  = usePriceStore()
const emit   = defineEmits(['close'])

const query       = ref('')
const strictMatch = ref(false)
const showCatalog = ref(false)
const inputRef    = ref(null)

function focusInput() {
  inputRef.value?.focus()
}

defineExpose({ focusInput })

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  emit('close')
  await store.search(q)
  router.push({ name: 'results' })
}

function onKeydown(e) {
  if (e.key === 'Enter') doSearch()
}
</script>

<template>
  <div class="sub-header">
    <div class="container sub-header__inner">

      <!-- Каталог продукции -->
      <div class="sub-header__catalog-wrap">
        <button
          class="sub-header__catalog-btn"
          type="button"
          @click="showCatalog = !showCatalog"
        >
          <span>Каталог продукции</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" class="sub-header__catalog-chevron" :class="{ 'sub-header__catalog-chevron--open': showCatalog }">
            <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Разделитель -->
      <div class="sub-header__divider" />

      <!-- Поисковое поле -->
      <div class="sub-header__search">
        <input
          v-model="query"
          type="text"
          class="sub-header__input"
          ref="inputRef"
          placeholder="Введите название категории, товара или ID СТЕ"
          autocomplete="off"
          @keydown="onKeydown"
        />

        <!-- Кнопка поиска -->
        <button
          class="sub-header__search-btn"
          type="button"
          :disabled="store.isLoading"
          aria-label="Найти"
          @click="doSearch"
        >
          <svg v-if="!store.isLoading" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5.5" stroke="#fff" stroke-width="1.8"/>
            <path d="M12 12l4.5 4.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span v-else class="sub-header__search-spinner" />
        </button>

        <!-- Закладка/Pin -->
        <button class="sub-header__pin-btn" type="button" aria-label="Сохранить поиск">
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path d="M3 1h12v12l-6 6-6-6V1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M1 7h16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

    </div>

    <!-- Строгое соответствие -->
    <div class="container sub-header__options">
      <label class="sub-header__strict">
        <span class="sub-header__strict-check" :class="{ 'sub-header__strict-check--on': strictMatch }">
          <input v-model="strictMatch" type="checkbox" class="sub-header__strict-input" />
          <svg v-if="strictMatch" width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="sub-header__strict-text">Строгое соответствие</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.sub-header {
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-gray-blue);
  padding: var(--space-3) 0 var(--space-2);
}

.sub-header__inner {
  display: flex;
  align-items: center;
  gap: 0;
}

/* --- Каталог --- */
.sub-header__catalog-wrap {
  flex-shrink: 0;
}

.sub-header__catalog-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;
  white-space: nowrap;
}

.sub-header__catalog-btn:hover {
  color: #1a3660;
}

.sub-header__catalog-chevron {
  color: var(--color-main-blue);
  transition: transform var(--transition-fast);
}

.sub-header__catalog-chevron--open {
  transform: rotate(180deg);
}

/* --- Разделитель --- */
.sub-header__divider {
  width: 1px;
  height: 28px;
  background-color: var(--color-gray-blue);
  margin: 0 var(--space-4);
  flex-shrink: 0;
}

/* --- Строка поиска --- */
.sub-header__search {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--color-pale-blue);
  border-radius: var(--radius-base);
  overflow: visible;
  gap: 0;
}

.sub-header__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  padding: 9px 14px;
  min-width: 0;
}

.sub-header__input::placeholder {
  color: var(--color-gray);
}

/* Красная кнопка поиска */
.sub-header__search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background-color: var(--color-red);
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color var(--transition-fast);
}

.sub-header__search-btn:hover {
  background-color: #b82219;
}

.sub-header__search-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Спиннер в кнопке */
.sub-header__search-spinner {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Pin-кнопка */
.sub-header__pin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray);
  margin-left: var(--space-2);
  border-radius: var(--radius-base);
  transition: color var(--transition-fast), background-color var(--transition-fast);
  flex-shrink: 0;
}

.sub-header__pin-btn:hover {
  color: var(--color-main-blue);
  background-color: var(--color-pale-blue);
}

/* --- Строгое соответствие --- */
.sub-header__options {
  padding-top: var(--space-2);
}

.sub-header__strict {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.sub-header__strict-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.sub-header__strict-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--color-gray-light);
  border-radius: 3px;
  background-color: var(--color-pale-blue);
  flex-shrink: 0;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.sub-header__strict-check--on {
  background-color: var(--color-main-blue);
  border-color: var(--color-main-blue);
}

.sub-header__strict-text {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

/* Spin animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .sub-header__catalog-wrap,
  .sub-header__divider { display: none; }
  .sub-header { padding: var(--space-2) 0; }
  .sub-header__input { font-size: var(--font-size-sm); padding: 7px 10px; }
  .sub-header__search-btn { width: 36px; height: 36px; }
  .sub-header__pin-btn { display: none; }
  .sub-header__options { padding-top: var(--space-1); }
  .sub-header__strict-text { font-size: var(--font-size-xs); }
}
</style>
