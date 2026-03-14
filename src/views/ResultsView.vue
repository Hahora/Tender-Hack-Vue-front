<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceStore }       from '../stores/priceStore.js'
import { usePriceCalculation } from '../composables/usePriceCalculation.js'
import CalculationSummary from '../components/results/CalculationSummary.vue'
import PriceFilter        from '../components/results/PriceFilter.vue'
import PriceResultCard    from '../components/results/PriceResultCard.vue'

const router = useRouter()
const store  = usePriceStore()

if (!store.hasSearched) {
  router.replace('/')
}

const {
  processedProcurements,
  validProcurements,
  weightedAvgUnitPrice,
  totalNmts,
  statistics,
  justificationText,
} = usePriceCalculation(
  computed(() => store.procurements),
  computed(() => store.filters),
  computed(() => store.requestedQty),
)

const activeFiltersCount = computed(() =>
  Object.entries(store.filters).filter(([key, val]) => {
    if (key === 'outliers') return val !== 'all'
    return Boolean(val)
  }).length
)

function resetFilters() {
  store.filters = { region: '', dateFrom: '', dateTo: '', vatRate: '', outliers: 'all' }
}

function goToDocument() {
  store.incrementVersion()
  router.push({ name: 'document' })
}

async function recalculate() {
  await store.search(store.steQuery)
}

// Список карточек с учётом фильтра выбросов
const displayList = computed(() => {
  const outliers = store.filters.outliers
  return processedProcurements.value.filter(p => {
    if (outliers === 'hide' && p.isOutlier && !p.manualInclude) return false
    if (outliers === 'only') return p.isOutlier
    return true
  })
})
</script>

<template>
  <div class="results">

    <!-- Шапка -->
    <div class="results__header-wrap">
      <div class="container">
        <div class="results__header">
          <div class="results__header-left">
            <button class="results__back" @click="router.push('/')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              На главную
            </button>
            <h1 class="results__title">
              <span class="results__title-label">СТЕ</span>
              <span class="results__title-query">{{ store.steQuery }}</span>
            </h1>
          </div>
          <div class="results__header-right">
            <div class="results__params-card">
              <p class="results__params-label">Параметры расчёта</p>
              <div class="results__params-row">
                <label class="results__param-item">
                  <span class="results__param-name">Кол-во</span>
                  <input v-model.number="store.requestedQty" type="number" min="1" class="results__param-input results__param-input--qty" />
                </label>
                <label class="results__param-item">
                  <span class="results__param-name">Ед.</span>
                  <input v-model="store.requestedUnit" type="text" class="results__param-input results__param-input--unit" placeholder="шт" />
                </label>
                <button class="results__recalc" :disabled="store.isLoading" @click="recalculate">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7a5 5 0 0 1 8.5-3.5L12 2M12 2v3H9M12 7a5 5 0 0 1-8.5 3.5L2 12M2 12V9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Пересчитать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Полоса фильтров -->
    <div class="results__filter-strip">
      <div class="container">
        <PriceFilter
          v-model="store.filters"
          :regions="store.availableRegions"
          :active-count="activeFiltersCount"
          @reset="resetFilters"
        />
      </div>
    </div>

    <!-- Тело -->
    <div class="container results__body">

      <!-- Загрузка -->
      <div v-if="store.isLoading" class="results__loading">
        <div class="results__spinner" />
        <div>
          <p class="results__loading-title">Загрузка данных из ЕИС…</p>
          <p class="results__loading-sub">Обрабатываем закупки по запросу «{{ store.steQuery }}»</p>
        </div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="store.error" class="results__error">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.6"/>
          <path d="M10 6v5M10 13v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        {{ store.error }}
        <button class="results__retry" @click="recalculate">Повторить</button>
      </div>

      <!-- Контент -->
      <div v-else class="results__layout">

        <!-- Левая колонка — карточки цен -->
        <div class="results__main">

          <!-- Список карточек цен -->
          <div v-if="displayList.length === 0" class="results__empty">
            Нет источников, соответствующих выбранным фильтрам
          </div>

          <div v-else class="results__list">
            <PriceResultCard
              v-for="(p, i) in displayList"
              :key="p.id"
              :procurement="p"
              :index="i"
              @toggle-exclude="store.toggleExclude($event)"
              @toggle-include="store.toggleManualInclude($event)"
            />
          </div>

        </div>

        <!-- Правая колонка — расчёт НМЦ -->
        <aside class="results__sidebar">
          <CalculationSummary
            :unit-price="weightedAvgUnitPrice"
            :total-nmts="totalNmts"
            :statistics="statistics"
            :requested-qty="store.requestedQty"
            :unit="store.requestedUnit"
            :justification-text="justificationText"
            :doc-version="store.docVersion"
            :is-recalculating="store.isLoading"
            @go-document="goToDocument"
            @recalculate="recalculate"
          />
        </aside>

      </div>
    </div>

  </div>
</template>

<style scoped>
.results {
  min-height: calc(100vh - 60px);
  background: #f5f8fc;
}

/* Шапка */
.results__header-wrap {
  background: #fff;
  border-bottom: 1px solid var(--color-gray-blue);
  padding: var(--space-5) 0 var(--space-4);
}

.results__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.results__header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.results__back {
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
}

.results__back:hover { text-decoration: underline; }

.results__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.results__title-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--font-weight-semibold);
}

.results__title-query {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.2;
}

/* Параметры */
.results__header-right { flex-shrink: 0; }

.results__params-card {
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.results__params-label {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* Полоса фильтров */
.results__filter-strip {
  background: #fff;
  border-bottom: 1px solid var(--color-gray-blue);
  padding: var(--space-1) 0;
}

/* Тело */
.results__body {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

/* Загрузка */
.results__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
}

.results__spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.results__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}

.results__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

/* Ошибка */
.results__error {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: #fdecea;
  border: 1px solid #f5beba;
  border-radius: var(--radius-md);
  color: var(--color-red);
}

.results__retry {
  margin-left: auto;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-red);
  background: none;
  border: 1px solid var(--color-red);
  border-radius: var(--radius-base);
  padding: 5px 14px;
  cursor: pointer;
}

/* Лейаут */
.results__layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-6);
  align-items: start;
}

/* Левая колонка — список карточек */
.results__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.results__params-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.results__param-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.results__param-name {
  font-size: 11px;
  color: var(--color-pale-black);
  white-space: nowrap;
}

.results__param-input {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 4px 6px;
  outline: none;
  height: 28px;
  transition: border-color var(--transition-fast);
}

.results__param-input:focus { border-color: var(--color-main-blue); }
.results__param-input--qty  { width: 54px; text-align: center; }
.results__param-input--unit { width: 44px; }

.results__recalc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.results__recalc:hover { background: var(--color-pale-blue); border-color: var(--color-main-blue); }
.results__recalc:disabled { opacity: 0.5; cursor: not-allowed; }

/* Sidebar */
.results__sidebar {
  position: sticky;
  top: 80px;
}

/* Список карточек */
.results__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.results__empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-pale-black);
  font-size: var(--font-size-base);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
}

@media (max-width: 1100px) {
  .results__layout { grid-template-columns: 1fr; }
  .results__sidebar { position: static; }
}

@media (max-width: 768px) {
  .results__header { flex-direction: column; gap: var(--space-4); }
  .results__title-query { font-size: var(--font-size-xl); }
}
</style>
