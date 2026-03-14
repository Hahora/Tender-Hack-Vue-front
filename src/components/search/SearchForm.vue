<script setup>
/**
 * Форма поиска СТЕ — главный элемент домашней страницы.
 * Содержит поле ввода, таблицу СТЕ (автодополнение) и кнопку поиска.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { STE_CATALOG } from '../../data/mockProcurements.js'
import AppButton from '../ui/AppButton.vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['search'])

const query            = ref('')
const showSuggestions  = ref(false)
const inputRef         = ref(null)

// Фильтруем СТЕ по введённому тексту
const suggestions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return STE_CATALOG.slice(0, 8)
  return STE_CATALOG.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q) ||
    s.manufacturer.toLowerCase().includes(q)
  ).slice(0, 8)
})

function onInput() {
  showSuggestions.value = true
}

function onFocus() {
  showSuggestions.value = true
}

function selectSuggestion(item) {
  query.value = item.name
  showSuggestions.value = false
  doSearch()
}

function doSearch() {
  const q = query.value.trim()
  if (!q) return
  showSuggestions.value = false
  emit('search', q)
}

// Закрыть подсказки при клике вне поля
function onDocClick(e) {
  if (!e.target.closest('.search-form')) {
    showSuggestions.value = false
  }
}

onMounted(()    => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="search-form">
    <div class="search-form__wrap" :class="{ 'search-form__wrap--open': showSuggestions && suggestions.length }">

      <!-- Иконка поиска слева -->
      <span class="search-form__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="6.5" stroke="#7F8792" stroke-width="1.8"/>
          <path d="M14 14l4.5 4.5" stroke="#7F8792" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </span>

      <!-- Поле ввода -->
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        class="search-form__input"
        placeholder="Введите наименование или идентификатор СТЕ"
        aria-label="Поиск СТЕ"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @keydown.enter="doSearch"
        @keydown.esc="showSuggestions = false"
      />

      <!-- Кнопка очистки -->
      <button
        v-if="query"
        class="search-form__clear"
        type="button"
        aria-label="Очистить поиск"
        @click="query = ''; inputRef?.focus()"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Кнопка поиска -->
      <AppButton
        class="search-form__btn"
        variant="primary"
        size="md"
        :loading="loading"
        @click="doSearch"
      >
        <span class="search-form__btn-text">Найти цены</span>
        <svg class="search-form__btn-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" stroke-width="1.8"/>
          <path d="M14 14l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </AppButton>
    </div>

    <!-- Выпадающий список СТЕ в виде таблицы -->
    <div v-if="showSuggestions && suggestions.length" class="search-form__suggestions" role="listbox">
      <!-- Заголовок таблицы -->
      <div class="search-form__table-head">
        <span>Идентификатор</span>
        <span>Наименование</span>
        <span>Категория</span>
        <span>Производитель</span>
        <span>Характеристики СТЕ</span>
      </div>
      <!-- Строки -->
      <button
        v-for="item in suggestions"
        :key="item.id"
        class="search-form__table-row"
        role="option"
        @mousedown.prevent="selectSuggestion(item)"
      >
        <span class="search-form__cell search-form__cell--id">{{ item.id }}</span>
        <span class="search-form__cell search-form__cell--name">{{ item.name }}</span>
        <span class="search-form__cell search-form__cell--cat">{{ item.category }}</span>
        <span class="search-form__cell search-form__cell--mfr">{{ item.manufacturer }}</span>
        <span class="search-form__cell search-form__cell--chars">{{ item.characteristics }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-form {
  position: relative;
  width: 100%;
  max-width: 900px;
}

/* --- Обёртка поля --- */
.search-form__wrap {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 2px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: 4px 4px 4px 16px;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-form__wrap:focus-within,
.search-form__wrap--open {
  border-color: var(--color-main-blue);
  box-shadow: 0 0 0 3px rgba(38, 75, 130, 0.1);
}

.search-form__wrap--open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

/* --- Иконка --- */
.search-form__icon {
  display: flex;
  flex-shrink: 0;
}

/* --- Поле ввода --- */
.search-form__input {
  flex: 1;
  border: none;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  color: var(--color-black);
  background: transparent;
  min-width: 0;
  padding: 8px 0;
}

.search-form__input::placeholder {
  color: var(--color-gray);
}

/* Убираем системную иконку очистки браузера */
.search-form__input::-webkit-search-cancel-button { display: none; }

/* --- Кнопка очистки --- */
.search-form__clear {
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

.search-form__clear:hover {
  color: var(--color-red);
  background-color: var(--color-pale-blue);
}

/* --- Кнопка поиска --- */
.search-form__btn {
  flex-shrink: 0;
  border-radius: var(--radius-base) !important;
}

.search-form__btn-icon {
  display: none;
}

@media (max-width: 480px) {
  .search-form__btn-text { display: none; }
  .search-form__btn-icon { display: block; }
  .search-form__btn {
    width: 38px !important;
    height: 38px !important;
    padding: 0 !important;
    justify-content: center;
  }
}

/* --- Таблица СТЕ --- */
.search-form__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 2px solid var(--color-main-blue);
  border-top: none;
  border-bottom-left-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  overflow: hidden;
  z-index: 50;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Заголовок таблицы */
.search-form__table-head {
  display: grid;
  grid-template-columns: 110px 1fr 150px 140px 200px;
  gap: 0;
  padding: 7px 16px;
  background: var(--color-pale-blue);
  border-bottom: 1px solid var(--color-gray-blue);
}

.search-form__table-head span {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-right: 8px;
}

/* Строки таблицы */
.search-form__table-row {
  display: grid;
  grid-template-columns: 110px 1fr 150px 140px 200px;
  gap: 0;
  width: 100%;
  padding: 9px 16px;
  font-family: var(--font-family);
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-gray-blue);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast);
}

.search-form__table-row:last-child {
  border-bottom: none;
}

.search-form__table-row:hover {
  background-color: var(--color-pale-blue);
}

.search-form__cell {
  font-size: var(--font-size-sm);
  color: var(--color-black);
  padding-right: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.search-form__cell--id {
  font-family: monospace;
  font-size: 12px;
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.search-form__cell--name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.search-form__cell--cat,
.search-form__cell--mfr {
  color: var(--color-pale-black);
  font-size: 12px;
}

.search-form__cell--chars {
  color: var(--color-pale-black);
  font-size: 12px;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
