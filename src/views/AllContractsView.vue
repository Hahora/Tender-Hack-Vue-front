<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePriceStore } from "../stores/priceStore.js";
import { formatPrice, formatDate } from "../composables/usePriceCalculation.js";

const router = useRouter();
const route = useRoute();
const store = usePriceStore();

onMounted(async () => {
  const q = route.query.q
  if (!q && !store.hasSearched) {
    router.replace('/')
    return
  }
  if (q && (!store.hasSearched || store.steQuery !== q)) {
    store.filters = {
      region:   String(route.query.region   || ''),
      vatRate:  String(route.query.vat      || ''),
      dateFrom: String(route.query.date_from || ''),
      dateTo:   String(route.query.date_to   || ''),
      outliers: 'all',
    }
    store.requestedUnit = route.query.unit ? String(route.query.unit) : 'шт'
    const workspaceParam = route.query.workspace
    if (workspaceParam) {
      await store.restoreWorkspace(workspaceParam)
    } else {
      await store.search(q)
    }
  }
  // Если q отсутствует в URL — добавляем со всеми параметрами
  if (store.steQuery && !route.query.q) {
    const f = store.filters
    router.replace({ query: {
      ...route.query,
      q:         store.steQuery,
      region:    f.region   || undefined,
      vat:       f.vatRate  || undefined,
      date_from: f.dateFrom || undefined,
      date_to:   f.dateTo   || undefined,
      unit:      store.requestedUnit !== 'шт' ? store.requestedUnit : undefined,
      workspace: store.workspaceId || undefined,
    }})
  }
})

// Синхронизируем workspace_id в URL
watch(() => store.workspaceId, (id) => {
  router.replace({
    query: { ...route.query, workspace: id || undefined },
  })
}, { immediate: true })

const initFilter = route.query.filter;
const activeFilters = ref(initFilter ? new Set([initFilter]) : new Set());

function toggleFilter(key) {
  const s = new Set(activeFilters.value);
  if (s.has(key)) s.delete(key);
  else s.add(key);
  activeFilters.value = s;
}

// Группируем закупки по контракту
const contracts = computed(() => {
  const map = new Map();
  for (const p of store.procurements) {
    if (!map.has(p.contractNumber)) {
      map.set(p.contractNumber, {
        contractNumber: p.contractNumber,
        steNumber: p.steNumber,
        supplier: p.supplier,
        customer: p.customer,
        region: p.supplierRegion || p.region,
        date: p.date,
        vatRate: p.vatRate,
        items: [],
      });
    }
    map.get(p.contractNumber).items.push(p);
  }
  return [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
});

// ── Отображение статусов ──────────────────────────────────────────────────
const STATUS_LABEL = {
  used:           'Учтено',
  outlier:        'Выброс IQR',
  force_included: 'Добавлен вручную',
}

const STATUS_BADGE_CLS = {
  used:           'ac__status-badge--green',
  outlier:        'ac__status-badge--orange',
  force_included: 'ac__status-badge--teal',
}

const ACTION_REASON = {
  outlier:        'Выброс по IQR — не учитывается в расчёте НМЦК',
  force_included: 'Добавлен вручную в расчёт НМЦК',
}

const ACTION_BTN_LABEL = {
  outlier:        'Включить в расчёт',
  force_included: 'Убрать из расчёта',
}

const CONFIRM_SUB = {
  outlier:        'Выброс будет включён в расчёт. НМЦК пересчитается автоматически.',
  force_included: 'Ручное включение будет отменено. НМЦК пересчитается автоматически.',
}

function contractStatus(c) {
  return c.items[0]?.contractStatus || 'used'
}

const filtered = computed(() => {
  if (activeFilters.value.size === 0) return contracts.value;
  return contracts.value.filter((c) => {
    const s = contractStatus(c);
    if (activeFilters.value.has('active')  && ['used', 'force_included'].includes(s)) return true;
    if (activeFilters.value.has('outlier') && s === 'outlier') return true;
    return false;
  });
});

const counts = computed(() => ({
  all:     contracts.value.length,
  active:  contracts.value.filter((c) => ['used', 'force_included'].includes(contractStatus(c))).length,
  outlier: contracts.value.filter((c) => contractStatus(c) === 'outlier').length,
}));

function contractTotal(items) {
  return items.reduce((sum, p) => sum + p.totalPrice, 0);
}

const confirmTarget = ref(null)

function toggleContractInclude(c) {
  confirmTarget.value = c
}

function doConfirm() {
  const c = confirmTarget.value
  if (!c) return
  confirmTarget.value = null
  store.contractAction(c.contractNumber)
}
</script>

<template>
  <div class="ac container">
    <!-- Назад -->
    <button class="ac__back" @click="router.back()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M10 3L5 8l5 5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Назад
    </button>

    <!-- Заголовок -->
    <div class="ac__header">
      <div>
        <p class="ac__eyebrow">Все актуальные контракты по запросу</p>
        <h1 class="ac__title">{{ store.steQuery }}</h1>
        <div class="ac__applied-filters">
          <span v-if="store.filters.region"   class="ac__af-tag"><span class="ac__af-key">Регион:</span> {{ store.filters.region }}</span>
          <span v-if="store.filters.vatRate"  class="ac__af-tag"><span class="ac__af-key">НДС:</span> {{ store.filters.vatRate }}</span>
          <span v-if="store.filters.dateFrom" class="ac__af-tag"><span class="ac__af-key">С:</span> {{ store.filters.dateFrom }}</span>
          <span v-if="store.filters.dateTo"   class="ac__af-tag"><span class="ac__af-key">По:</span> {{ store.filters.dateTo }}</span>
          <span v-if="store.requestedUnit && store.requestedUnit !== 'шт'" class="ac__af-tag"><span class="ac__af-key">Ед.:</span> {{ store.requestedUnit }}</span>
        </div>
      </div>
      <div class="ac__badge">{{ contracts.length }} контрактов</div>
    </div>

    <!-- Загрузка -->
    <div v-if="store.isLoading" class="ac__loading">
      <div class="ac__spinner" />
      <div>
        <p class="ac__loading-title">Загружаем контракты…</p>
        <p class="ac__loading-sub">Запрос «{{ store.steQuery || route.query.q }}»</p>
      </div>
    </div>

    <!-- Фильтр по статусу -->
    <div v-if="!store.isLoading" class="ac__filters">
      <button
        class="ac__filter-btn"
        :class="{ 'ac__filter-btn--active': activeFilters.size === 0 }"
        @click="activeFilters = new Set()"
      >
        Все <span class="ac__filter-count">{{ counts.all }}</span>
      </button>
      <button
        class="ac__filter-btn ac__filter-btn--green"
        :class="{ 'ac__filter-btn--active': activeFilters.has('active') }"
        @click="toggleFilter('active')"
      >
        <span class="ac__dot ac__dot--green" />
        Учтено <span class="ac__filter-count">{{ counts.active }}</span>
      </button>
      <button
        class="ac__filter-btn ac__filter-btn--orange"
        :class="{ 'ac__filter-btn--active': activeFilters.has('outlier') }"
        @click="toggleFilter('outlier')"
      >
        <span class="ac__dot ac__dot--orange" />
        Выброс IQR <span class="ac__filter-count">{{ counts.outlier }}</span>
      </button>
    </div>

    <!-- Список -->
    <template v-if="!store.isLoading">
    <div v-if="filtered.length === 0" class="ac__empty">
      Контракты не найдены
    </div>

    <div v-else class="ac__list">
      <div
        v-for="c in filtered"
        :key="c.contractNumber"
        class="ac__card"
        :class="{
          'ac__card--outlier':        contractStatus(c) === 'outlier',
          'ac__card--force-included': contractStatus(c) === 'force_included',
        }"
        @click="
          router.push({
            name: 'contract-detail',
            params: { number: c.contractNumber },
            query: { steId: c.steNumber },
          })
        "
      >
        <!-- Акцентная полоса -->
        <div
          class="ac__card-accent"
          :class="{
            'ac__card-accent--green':  contractStatus(c) === 'used',
            'ac__card-accent--orange': contractStatus(c) === 'outlier',
            'ac__card-accent--teal':   contractStatus(c) === 'force_included',
          }"
        />

        <div class="ac__card-inner">
          <div class="ac__card-row">
            <!-- Левая: мета + детали -->
            <div class="ac__card-left">
              <div class="ac__card-meta">
                <span class="ac__contract-num">{{ c.contractNumber }}</span>
                <span class="ac__status-badge" :class="STATUS_BADGE_CLS[contractStatus(c)]">
                  <span class="ac__status-dot" />
                  {{ STATUS_LABEL[contractStatus(c)] }}
                </span>
              </div>
              <div class="ac__date">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect
                    x="1"
                    y="2"
                    width="10"
                    height="9"
                    rx="1.5"
                    stroke="currentColor"
                    stroke-width="1.2"
                  />
                  <path
                    d="M4 1v2M8 1v2"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  />
                  <path d="M1 5h10" stroke="currentColor" stroke-width="1.2" />
                </svg>
                {{ formatDate(c.date) }}
              </div>
              <div class="ac__card-details">
                <div class="ac__detail">
                  <span class="ac__detail-label">Поставщик</span>
                  <span class="ac__detail-val">{{ c.supplier }}</span>
                </div>
                <div class="ac__detail">
                  <span class="ac__detail-label">Заказчик</span>
                  <span class="ac__detail-val">{{ c.customer }}</span>
                </div>
                <div class="ac__detail-row">
                  <span class="ac__tag">{{ c.region }}</span>
                  <span class="ac__tag">НДС {{ c.vatRate || 'нет' }}</span>
                  <span class="ac__tag">{{ c.items.length }} поз.</span>
                  <button
                    class="ac__ste-tag"
                    @click.stop="router.push({
                      name: 'contracts',
                      params: { ste: c.steNumber },
                      query: {
                        q:         store.steQuery          || undefined,
                        region:    store.filters.region    || undefined,
                        date_from: store.filters.dateFrom  || undefined,
                        date_to:   store.filters.dateTo    || undefined,
                        vat:       store.filters.vatRate   || undefined,
                        workspace: store.workspaceId       || undefined,
                      },
                    })"
                  >
                    {{ c.steNumber }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Правая: цена + итог -->
            <div class="ac__card-right">
              <div class="ac__price-area">
                <span class="ac__price-caption">за единицу</span>
                <div class="ac__price-row">
                  <span class="ac__price">{{
                    formatPrice(c.items[0]?.unitPrice)
                  }}</span>
                  <span class="ac__price-sep">/</span>
                  <span class="ac__price-unit">{{ c.items[0]?.unit }}</span>
                </div>
              </div>
              <div class="ac__total-area">
                <span class="ac__price-caption">сумма контракта</span>
                <span class="ac__total">{{
                  formatPrice(contractTotal(c.items))
                }}</span>
              </div>
            </div>
          </div>

          <!-- Статус-бар: только для выбросов -->
          <div
            v-if="contractStatus(c) !== 'used'"
            class="ac__action-bar"
            :class="`ac__action-bar--${contractStatus(c)}`"
            @click.stop
          >
            <div class="ac__action-reason">
              <svg v-if="contractStatus(c) === 'outlier'" width="12" height="11" viewBox="0 0 13 12" fill="none">
                <path d="M6.5.5L12.5 11H.5L6.5.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M6.5 4.5v3M6.5 9v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 6l1.5 1.5L8.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ ACTION_REASON[contractStatus(c)] }}
            </div>
            <button
              class="ac__include-btn"
              :class="{
                'ac__include-btn--add':    contractStatus(c) === 'outlier',
                'ac__include-btn--remove': contractStatus(c) === 'force_included',
              }"
              @click.stop="toggleContractInclude(c)"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                <path v-if="contractStatus(c) === 'outlier'" d="M3 5.5l2 2 3-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path v-else d="M3.5 3.5l4 4M7.5 3.5l-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ ACTION_BTN_LABEL[contractStatus(c)] }}
            </button>
          </div>
        </div>

        <!-- Стрелка -->
        <div class="ac__card-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
    </template>

    <!-- Диалог подтверждения пересчёта -->
    <Teleport to="body">
      <Transition name="ac-modal">
        <div v-if="confirmTarget" class="ac__overlay" @click.self="confirmTarget = null">
          <div class="ac__dialog">
            <div class="ac__dialog-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="currentColor" stroke-width="1.6"/>
                <path d="M11 7v5M11 15v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="ac__dialog-body">
              <p class="ac__dialog-title">Будет выполнен пересчёт НМЦК</p>
              <p class="ac__dialog-sub">{{ CONFIRM_SUB[contractStatus(confirmTarget)] }}</p>
            </div>
            <div class="ac__dialog-actions">
              <button class="ac__dialog-cancel" @click="confirmTarget = null">Отмена</button>
              <button class="ac__dialog-confirm" @click="doConfirm">Пересчитать</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ac {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.ac__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.ac__spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: ac-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes ac-spin {
  to { transform: rotate(360deg); }
}

.ac__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}

.ac__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.ac__back {
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
.ac__back:hover {
  text-decoration: underline;
}

.ac__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
}

.ac__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.ac__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: var(--space-2);
}

.ac__applied-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: 4px;
}

.ac__af-tag {
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

.ac__af-key {
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
}

.ac__badge {
  padding: 5px 14px;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  white-space: nowrap;
}

/* Фильтры */
.ac__filters {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.ac__filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 5px 14px;
  cursor: pointer;
  transition: border-color var(--transition-fast),
    background var(--transition-fast), color var(--transition-fast);
}
.ac__filter-btn:hover {
  border-color: var(--color-main-blue);
  color: var(--color-main-blue);
}
.ac__filter-btn--active {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
  color: var(--color-main-blue);
}

.ac__filter-count {
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  opacity: 0.7;
}

.ac__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ac__dot--green {
  background: var(--color-green);
}
.ac__dot--orange {
  background: #e8920a;
}

/* Список */
.ac__empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-pale-black);
  font-size: var(--font-size-md);
}

.ac__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Карточка */
.ac__card {
  display: flex;
  align-items: stretch;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-left: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}
.ac__card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.ac__card--outlier        { background: #fffcf5; }
.ac__card--force-included { background: #f0faf6; }
.ac__card--force-excluded { background: #fff5f5; }

.ac__card-accent {
  width: 4px;
  flex-shrink: 0;
}
.ac__card-accent--green  { background: #0d9b68; }
.ac__card-accent--orange { background: #f9c56a; }
.ac__card-accent--teal   { background: #167c85; }
.ac__card-accent--red    { background: #d94f4f; }

.ac__card-inner {
  flex: 1;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.ac__card-arrow {
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  color: var(--color-gray-light);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.ac__card:hover .ac__card-arrow {
  color: var(--color-main-blue);
}

.ac__card-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
}

.ac__card-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.ac__card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.ac__contract-num {
  font-family: monospace;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  letter-spacing: 0.02em;
}

.ac__status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.ac__status-badge--green  { color: #0d9b68; background: #e6f5ee; }
.ac__status-badge--orange { color: #c27000; background: #fff6e4; }
.ac__status-badge--teal   { color: #167c85; background: #e4f4f5; }
.ac__status-badge--red    { color: #c0392b; background: #fdecea; }

.ac__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.ac__date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  white-space: nowrap;
}

.ac__card-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ac__detail {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ac__detail-label {
  font-size: 10px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ac__detail-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ac__detail-row {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  margin-top: 2px;
  align-items: center;
}

.ac__tag {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 1px 8px;
  white-space: nowrap;
}

.ac__ste-tag {
  font-family: monospace;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid rgba(38, 75, 130, 0.25);
  border-radius: var(--radius-full);
  padding: 1px 8px;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--transition-fast),
    border-color var(--transition-fast);
}
.ac__ste-tag:hover {
  background: #dce8f5;
  border-color: var(--color-main-blue);
}

/* Правая: цена */
.ac__card-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: var(--space-2);
  text-align: right;
}

.ac__price-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.ac__price-caption {
  font-size: 10px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ac__price-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.ac__price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  white-space: nowrap;
}

.ac__price-sep {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}
.ac__price-unit {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.ac__total-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-gray-blue);
  width: 100%;
}

.ac__total {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  white-space: nowrap;
}

/* Статус-бар (отображается для всех статусов) */
.ac__action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}
.ac__action-bar--used           { background: #eef4fb; }
.ac__action-bar--outlier        { background: #fff8ed; }
.ac__action-bar--force_included { background: #e8f7f0; }
.ac__action-bar--force_excluded { background: #fdecea; }

.ac__action-reason {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}
.ac__action-bar--used           .ac__action-reason { color: #2a5298; }
.ac__action-bar--outlier        .ac__action-reason { color: #7a4400; }
.ac__action-bar--force_included .ac__action-reason { color: #0d6b52; }
.ac__action-bar--force_excluded .ac__action-reason { color: #a03030; }

.ac__include-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-base);
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
  border: 1px solid;
}
.ac__include-btn--add    { color: #0d6b52; background: #d4f5e4; border-color: #0d9b68; }
.ac__include-btn--add:hover { background: #b8edce; border-color: #0a7a52; }
.ac__include-btn--remove { color: #a03030; background: #fce8e8; border-color: #d94f4f; }
.ac__include-btn--remove:hover { background: #f8d0d0; border-color: #b03030; }

/* Диалог подтверждения */
.ac__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.ac__dialog {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  padding: var(--space-6);
  max-width: 380px;
  width: calc(100% - 32px);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.ac__dialog-icon {
  color: var(--color-main-blue);
  display: flex;
}
.ac__dialog-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: 4px;
}
.ac__dialog-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  line-height: 1.5;
}
.ac__dialog-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
.ac__dialog-cancel {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 8px 18px;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.ac__dialog-cancel:hover { background: #dce8f5; }
.ac__dialog-confirm {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-main-blue);
  border: 1px solid var(--color-main-blue);
  border-radius: var(--radius-base);
  padding: 8px 18px;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.ac__dialog-confirm:hover { opacity: 0.88; }

.ac-modal-enter-active { transition: opacity 180ms ease; }
.ac-modal-leave-active { transition: opacity 150ms ease; }
.ac-modal-enter-from, .ac-modal-leave-to { opacity: 0; }
</style>
