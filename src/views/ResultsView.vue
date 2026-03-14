<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePriceStore } from "../stores/priceStore.js";
import { usePriceCalculation } from "../composables/usePriceCalculation.js";
import CalculationSummary from "../components/results/CalculationSummary.vue";
import PriceFilter from "../components/results/PriceFilter.vue";
import PriceResultCard from "../components/results/PriceResultCard.vue";

const router = useRouter();
const route  = useRoute();
const store  = usePriceStore();

// Восстанавливаем поиск и фильтры из URL при обновлении страницы
onMounted(async () => {
  const q = route.query.q;
  if (q) {
    if (!store.hasSearched || store.steQuery !== q) {
      await store.search(q);
    }
  } else if (!store.hasSearched) {
    router.replace("/");
    return;
  }

  // Применяем фильтры из URL (или регион пользователя как дефолт)
  store.filters = {
    region:   String(route.query.region   || store.userRegion || ""),
    vatRate:  String(route.query.vatRate  || ""),
    dateFrom: String(route.query.dateFrom || ""),
    dateTo:   String(route.query.dateTo   || ""),
    outliers: "all",
  };
});

// Синхронизируем фильтры в URL при их изменении
watch(
  () => store.filters,
  (f) => {
    router.replace({
      query: {
        q:        store.steQuery || undefined,
        region:   f.region   || undefined,
        vatRate:  f.vatRate  || undefined,
        dateFrom: f.dateFrom || undefined,
        dateTo:   f.dateTo   || undefined,
      },
    });
  },
  { deep: true }
);

const {
  processedProcurements,
  weightedAvgUnitPrice,
  totalNmts,
  statistics,
  justificationText,
} = usePriceCalculation(
  computed(() => store.procurements),
  computed(() => store.filters),
  computed(() => store.requestedQty)
);

// Если бэк вернул данные НМЦК — используем их, иначе клиентский расчёт
const displayUnitPrice = computed(() =>
  store.nmckData ? store.nmckData.nmck : weightedAvgUnitPrice.value
);

const displayTotalNmts = computed(() =>
  displayUnitPrice.value * store.requestedQty
);

const displayStatistics = computed(() => {
  if (store.nmckData) {
    const d = store.nmckData;
    return {
      count:        d.n_contracts,
      outlierCount: d.n_outliers,
      excludedCount: 0,
      minPrice:     d.price_min,
      maxPrice:     d.price_max,
      medianPrice:  d.nmck,
    };
  }
  return statistics.value;
});

const activeFiltersCount = computed(
  () => Object.values(store.filters).filter(Boolean).length
);

function resetFilters() {
  store.filters = {
    region: "",
    dateFrom: "",
    dateTo: "",
    vatRate: "",
  };
}

function goToDocument() {
  store.incrementVersion();
  router.push({ name: "document" });
}

async function recalculate() {
  await store.search(store.steQuery);
}

/* ─── Пагинация ─── */
const PAGE_SIZE_OPTIONS = [12, 24, 48]
const pageSize    = ref(12)
const currentPage = ref(1)

// Сбрасываем на первую страницу при новом поиске или смене размера
watch(() => store.steQuery, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })

const totalPages = computed(() =>
  Math.max(1, Math.ceil(processedProcurements.value.length / pageSize.value))
)

const displayList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return processedProcurements.value.slice(start, start + pageSize.value)
})

function goToPage(p) {
  currentPage.value = Math.min(Math.max(1, p), totalPages.value)
  window.scrollTo({ top: 0, behavior: "smooth" })
}
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
                <path
                  d="M10 3L5 8l5 5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              На главную
            </button>
            <h1 class="results__title">
              <span class="results__title-label">СТЕ</span>
              <span class="results__title-query">{{ store.steQuery }}</span>
            </h1>
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
          <p class="results__loading-sub">
            Обрабатываем закупки по запросу «{{ store.steQuery }}»
          </p>
        </div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="store.error" class="results__error">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="9"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M10 6v5M10 13v.5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
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
              :index="(currentPage - 1) * pageSize + i"
            />

            <!-- Пагинация -->
            <div class="pg">
              <!-- Выбор кол-ва на странице -->
              <div class="pg__size">
                <span class="pg__size-label">По</span>
                <button
                  v-for="n in PAGE_SIZE_OPTIONS"
                  :key="n"
                  class="pg__size-btn"
                  :class="{ 'pg__size-btn--active': pageSize === n }"
                  @click="pageSize = n"
                >{{ n }}</button>
              </div>

              <span class="pg__info">
                {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, processedProcurements.length) }}
                из {{ processedProcurements.length }}
              </span>

              <!-- Кнопки страниц -->
              <div class="pg__nav">
                <button class="pg__btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M6 1L1 6l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>

                <template v-for="p in totalPages" :key="p">
                  <button
                    v-if="p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1"
                    class="pg__page"
                    :class="{ 'pg__page--active': p === currentPage }"
                    @click="goToPage(p)"
                  >{{ p }}</button>
                  <span
                    v-else-if="p === currentPage - 2 || p === currentPage + 2"
                    class="pg__dots"
                  >…</span>
                </template>

                <button class="pg__btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                    <path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка — расчёт НМЦ -->
        <aside class="results__sidebar">
          <CalculationSummary
            :unit-price="displayUnitPrice"
            :total-nmts="displayTotalNmts"
            :statistics="displayStatistics"
            :requested-qty="store.requestedQty"
            :unit="store.requestedUnit"
            :justification-text="justificationText"
            :doc-version="store.docVersion"
            :is-recalculating="store.isLoading"
            @go-document="goToDocument"
            @recalculate="recalculate"
            @update:requested-qty="store.requestedQty = $event"
            @update:unit="store.requestedUnit = $event"
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

.results__back:hover {
  text-decoration: underline;
}

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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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
  .results__layout {
    grid-template-columns: 1fr;
  }
  .results__sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .results__header {
    flex-direction: column;
    gap: var(--space-4);
  }
  .results__title-query {
    font-size: var(--font-size-xl);
  }
}

/* ─── Пагинация ─── */
.pg {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-4) 0 var(--space-2);
  border-top: 1px solid var(--color-gray-blue);
  margin-top: var(--space-2);
}

.pg__size {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.pg__size-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  margin-right: 2px;
}

.pg__size-btn {
  height: 28px;
  min-width: 36px;
  padding: 0 8px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.pg__size-btn:hover { background: var(--color-pale-blue); border-color: var(--color-main-blue); }

.pg__size-btn--active {
  background: var(--color-main-blue);
  border-color: var(--color-main-blue);
  color: #fff;
}

.pg__info {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  margin-left: auto;
}

.pg__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pg__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  color: var(--color-main-blue);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.pg__btn:hover:not(:disabled) {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
}

.pg__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pg__page {
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.pg__page:hover { background: var(--color-pale-blue); border-color: var(--color-main-blue); }

.pg__page--active {
  background: var(--color-main-blue);
  border-color: var(--color-main-blue);
  color: #fff;
}

.pg__dots {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 0 2px;
  user-select: none;
}

@media (max-width: 640px) {
  .pg { gap: var(--space-2); }
  .pg__info { margin-left: 0; width: 100%; order: -1; }
}
</style>
