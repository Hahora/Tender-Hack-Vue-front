<script setup>
/**
 * Подшапка — строка поиска СТЕ.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceStore } from '../stores/priceStore.js'

const router = useRouter()
const store  = usePriceStore()
const emit   = defineEmits(['close'])

const query    = ref('')
const inputRef = ref(null)

function focusInput() {
  inputRef.value?.focus()
}

defineExpose({ focusInput })

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  emit('close')
  await store.search(q)
  router.push({ name: 'results', query: { q, workspace: store.workspaceId || undefined } })
}

function onKeydown(e) {
  if (e.key === 'Enter') doSearch()
}
</script>

<template>
  <div class="sub-header">
    <div class="container sub-header__inner">

      <!-- Поисковое поле -->
      <div class="sub-header__search">
        <svg class="sub-header__search-icon" width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 12l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>

        <input
          v-model="query"
          type="text"
          class="sub-header__input"
          ref="inputRef"
          placeholder="Введите наименование СТЕ"
          autocomplete="off"
          @keydown="onKeydown"
        />

        <!-- Очистить -->
        <button
          v-if="query"
          class="sub-header__clear"
          type="button"
          aria-label="Очистить"
          @click="query = ''; inputRef?.focus()"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

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
      </div>

    </div>
  </div>
</template>

<style scoped>
.sub-header {
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-gray-blue);
  padding: var(--space-3) 0;
}

.sub-header__inner {
  display: flex;
  align-items: center;
}

/* --- Строка поиска --- */
.sub-header__search {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding-left: 12px;
  gap: var(--space-2);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.sub-header__search:focus-within {
  border-color: var(--color-main-blue);
  box-shadow: 0 0 0 3px rgba(38, 75, 130, 0.08);
}

.sub-header__search-icon {
  color: var(--color-gray);
  flex-shrink: 0;
}

.sub-header__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  padding: 9px 0;
  min-width: 0;
}

.sub-header__input::placeholder {
  color: var(--color-gray);
}

/* Кнопка очистки */
.sub-header__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-pale-black);
  border-radius: var(--radius-base);
  flex-shrink: 0;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.sub-header__clear:hover {
  color: var(--color-red);
  background-color: rgba(0,0,0,0.05);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .sub-header { padding: var(--space-2) 0; }
  .sub-header__input { font-size: var(--font-size-sm); padding: 7px 0; }
  .sub-header__search-btn { width: 36px; height: 36px; }
}
</style>
