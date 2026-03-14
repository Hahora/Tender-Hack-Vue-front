<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStore } from '../stores/priceStore.js'
import { api } from '../api/api.js'

const route  = useRoute()
const router = useRouter()
const store  = usePriceStore()

const steId     = route.params.id
const ste       = ref(null)
const isLoading = ref(false)
const notFound  = ref(false)

const characteristics = computed(() => {
  if (!ste.value?.characteristics) return []
  return Object.entries(ste.value.characteristics)
})

onMounted(async () => {
  isLoading.value = true
  try {
    ste.value = await store.withAuth(token => api.ste(steId, token))
  } catch (_e) {
    notFound.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="sd container">

    <!-- Назад -->
    <button class="sd__back" @click="router.back()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Назад
    </button>

    <div v-if="isLoading" class="sd__loading">
      <div class="sd__spinner" />
      <div>
        <p class="sd__loading-title">Загрузка данных…</p>
        <p class="sd__loading-sub">Получаем информацию по СТЕ</p>
      </div>
    </div>
    <div v-else-if="notFound || !ste" class="sd__empty">СТЕ не найдена</div>

    <template v-else>

      <!-- Заголовок -->
      <div class="sd__header">
        <div>
          <p class="sd__eyebrow">Справочник технических элементов</p>
          <h1 class="sd__title">{{ ste.name }}</h1>
          <div class="sd__applied-filters">
            <span v-if="store.filters.region || route.query.region" class="sd__af-tag">
              <span class="sd__af-key">Регион:</span> {{ store.filters.region || route.query.region }}
            </span>
            <span v-if="store.filters.vatRate || route.query.vat" class="sd__af-tag">
              <span class="sd__af-key">НДС:</span> {{ store.filters.vatRate || route.query.vat }}
            </span>
            <span v-if="store.filters.dateFrom || route.query.date_from" class="sd__af-tag">
              <span class="sd__af-key">С:</span> {{ store.filters.dateFrom || route.query.date_from }}
            </span>
            <span v-if="store.filters.dateTo || route.query.date_to" class="sd__af-tag">
              <span class="sd__af-key">По:</span> {{ store.filters.dateTo || route.query.date_to }}
            </span>
          </div>
        </div>
        <span class="sd__id-badge">{{ ste.ste_id }}</span>
      </div>

      <!-- Основные поля -->
      <div class="sd__info-card">
        <div class="sd__info-row">
          <span class="sd__info-label">Идентификатор</span>
          <span class="sd__info-val sd__info-val--mono">{{ ste.ste_id }}</span>
        </div>
        <div class="sd__info-row">
          <span class="sd__info-label">Наименование</span>
          <span class="sd__info-val">{{ ste.name }}</span>
        </div>
        <div v-if="ste.category" class="sd__info-row">
          <span class="sd__info-label">Категория</span>
          <span class="sd__info-val">{{ ste.category }}</span>
        </div>
        <div v-if="ste.manufacturer" class="sd__info-row">
          <span class="sd__info-label">Производитель</span>
          <span class="sd__info-val">{{ ste.manufacturer }}</span>
        </div>
      </div>

      <!-- Характеристики -->
      <div v-if="characteristics.length" class="sd__chars-card">
        <div class="sd__chars-title">Характеристики</div>
        <div v-for="[key, val] in characteristics" :key="key" class="sd__info-row">
          <span class="sd__info-label">{{ key }}</span>
          <span class="sd__info-val">{{ val }}</span>
        </div>
      </div>

      <!-- Кнопка перехода к контрактам -->
      <button
        class="sd__contracts-btn"
        @click="router.push({
          name: 'contracts',
          params: { ste: ste.ste_id },
          query: {
            q:         store.steQuery          || route.query.q          || undefined,
            region:    store.filters.region    || route.query.region     || undefined,
            date_from: store.filters.dateFrom  || route.query.date_from  || undefined,
            date_to:   store.filters.dateTo    || route.query.date_to    || undefined,
            vat:       store.filters.vatRate   || route.query.vat        || undefined,
          },
        })"
      >
        <div class="sd__contracts-btn-left">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3h9l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M13 3v4h4M6 10h8M6 13h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <div>
            <p class="sd__contracts-btn-title">Контракты по данному СТЕ</p>
            <p class="sd__contracts-btn-sub">Просмотреть список контрактов в ЕИС</p>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

    </template>
  </div>
</template>

<style scoped>
.sd {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.sd__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-5);
}

.sd__back:hover { text-decoration: underline; }

.sd__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
}

.sd__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.sd__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.2;
}

.sd__id-badge {
  padding: 5px 14px;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: monospace;
  color: var(--color-main-blue);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Карточка с информацией */
.sd__info-card {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-4);
}

.sd__chars-card {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-4);
}

.sd__chars-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: var(--space-3) var(--space-5);
  background: var(--color-pale-blue);
  border-bottom: 1px solid var(--color-gray-blue);
}

.sd__info-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-6);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
}

.sd__info-row:last-child { border-bottom: none; }

.sd__info-label {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  min-width: 160px;
  flex-shrink: 0;
}

.sd__info-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.sd__info-val--mono {
  font-family: monospace;
  color: var(--color-main-blue);
}

/* Кнопка контрактов */
.sd__contracts-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-5);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-family);
  text-align: left;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  color: var(--color-black);
}

.sd__contracts-btn:hover {
  border-color: var(--color-main-blue);
  box-shadow: var(--shadow-base);
}

.sd__contracts-btn-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-main-blue);
}

.sd__contracts-btn-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  margin-bottom: 2px;
}

.sd__contracts-btn-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.sd__empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-pale-black);
  font-size: var(--font-size-md);
}

/* Загрузка */
.sd__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
}

.sd__spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sd__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}

.sd__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.sd__applied-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: 4px;
}

.sd__af-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 2px 10px;
  white-space: nowrap;
}

.sd__af-key {
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
}
</style>
