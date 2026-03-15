<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePriceStore } from "../stores/priceStore.js";
import { formatPrice, formatDate } from "../composables/usePriceCalculation.js";

const router = useRouter();
const route  = useRoute();
const store  = usePriceStore();

onMounted(async () => {
  if (!store.hasSearched && route.query.q) {
    store.filters.region   = route.query.region    || ''
    store.filters.dateFrom = route.query.date_from || ''
    store.filters.dateTo   = route.query.date_to   || ''
    store.filters.vatRate  = route.query.vat        || ''
    const workspaceParam = route.query.workspace
    if (workspaceParam) {
      await store.restoreWorkspace(workspaceParam)
    } else {
      await store.search(route.query.q)
    }
  } else if (!store.hasSearched) {
    router.replace('/')
  }
})

// Синхронизируем workspace_id в URL
watch(() => store.workspaceId, (id) => {
  router.replace({
    query: { ...route.query, workspace: id || undefined },
  })
}, { immediate: true })

const steParam = route.params.ste

const initFilter = route.query.filter
const activeFilters = ref(initFilter ? new Set([initFilter]) : new Set())

function toggleFilter(key) {
  const s = new Set(activeFilters.value)
  if (s.has(key)) s.delete(key); else s.add(key)
  activeFilters.value = s
}

// ── Отображение статусов ──────────────────────────────────────────────────
const STATUS_LABEL = {
  used:           'Учтено',
  outlier:        'Выброс IQR',
  force_included: 'Добавлен вручную',
}

const STATUS_BADGE_CLS = {
  used:           'cl__status-badge--green',
  outlier:        'cl__status-badge--orange',
  force_included: 'cl__status-badge--teal',
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

// ── Данные ────────────────────────────────────────────────────────────────
const contracts = computed(() => {
  const map = new Map()
  for (const p of store.procurements) {
    if (steParam && p.steNumber !== steParam) continue
    if (!map.has(p.contractNumber)) {
      map.set(p.contractNumber, {
        contractNumber: p.contractNumber,
        steNumber:      p.steNumber,
        supplier:       p.supplier,
        customer:       p.customer,
        region:         p.supplierRegion || p.region,
        date:           p.date,
        vatRate:        p.vatRate,
        items:          [],
      })
    }
    map.get(p.contractNumber).items.push(p)
  }
  return [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Статус берём напрямую из поля contractStatus (проставляется applyNmck)
function contractStatus(c) {
  return c.items[0]?.contractStatus || 'used'
}

const filtered = computed(() => {
  if (activeFilters.value.size === 0) return contracts.value
  return contracts.value.filter(c => {
    const s = contractStatus(c)
    if (activeFilters.value.has('active')  && ['used', 'force_included'].includes(s)) return true
    if (activeFilters.value.has('outlier') && s === 'outlier') return true
    return false
  })
})

const counts = computed(() => ({
  all:     contracts.value.length,
  active:  contracts.value.filter(c => ['used', 'force_included'].includes(contractStatus(c))).length,
  outlier: contracts.value.filter(c => contractStatus(c) === 'outlier').length,
}))

function contractTotal(items) {
  return items.reduce((sum, p) => sum + p.totalPrice, 0)
}

// ── Диалог подтверждения ──────────────────────────────────────────────────
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
  <div class="cl container">
    <!-- Назад -->
    <button class="cl__back" @click="router.back()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Назад
    </button>

    <!-- Заголовок -->
    <div class="cl__header">
      <div>
        <p class="cl__eyebrow">
          Контракты по СТЕ
          <template v-if="steParam">
            &nbsp;·&nbsp;
            <button
              class="cl__ste-link"
              @click="router.push({ name: 'ste-detail', params: { id: steParam }, query: {
                q:         store.steQuery          || route.query.q          || undefined,
                region:    store.filters.region    || route.query.region     || undefined,
                date_from: store.filters.dateFrom  || route.query.date_from  || undefined,
                date_to:   store.filters.dateTo    || route.query.date_to    || undefined,
                vat:       store.filters.vatRate   || route.query.vat        || undefined,
              } })"
            >{{ steParam }}</button>
          </template>
        </p>
        <h1 class="cl__title">{{ store.steQuery }}</h1>
        <div class="cl__applied-filters">
          <span v-if="store.filters.region || route.query.region" class="cl__af-tag">
            <span class="cl__af-key">Регион:</span> {{ store.filters.region || route.query.region }}
          </span>
          <span v-if="store.filters.vatRate || route.query.vat" class="cl__af-tag">
            <span class="cl__af-key">НДС:</span> {{ store.filters.vatRate || route.query.vat }}
          </span>
          <span v-if="store.filters.dateFrom || route.query.date_from" class="cl__af-tag">
            <span class="cl__af-key">С:</span> {{ store.filters.dateFrom || route.query.date_from }}
          </span>
          <span v-if="store.filters.dateTo || route.query.date_to" class="cl__af-tag">
            <span class="cl__af-key">По:</span> {{ store.filters.dateTo || route.query.date_to }}
          </span>
        </div>
      </div>
      <div class="cl__badge">{{ contracts.length }} контрактов</div>
    </div>

    <!-- Загрузка -->
    <div v-if="store.isLoading" class="cl__loading">
      <div class="cl__spinner" />
      <div>
        <p class="cl__loading-title">Загружаем контракты…</p>
        <p class="cl__loading-sub">Запрос «{{ store.steQuery || route.query.q }}»</p>
      </div>
    </div>

    <!-- Фильтр по статусу -->
    <div v-if="!store.isLoading" class="cl__filters">
      <button
        class="cl__filter-btn"
        :class="{ 'cl__filter-btn--active': activeFilters.size === 0 }"
        @click="activeFilters = new Set()"
      >
        Все <span class="cl__filter-count">{{ counts.all }}</span>
      </button>
      <button
        class="cl__filter-btn cl__filter-btn--green"
        :class="{ 'cl__filter-btn--active': activeFilters.has('active') }"
        @click="toggleFilter('active')"
      >
        <span class="cl__dot cl__dot--green" />
        Учтено <span class="cl__filter-count">{{ counts.active }}</span>
      </button>
      <button
        class="cl__filter-btn cl__filter-btn--orange"
        :class="{ 'cl__filter-btn--active': activeFilters.has('outlier') }"
        @click="toggleFilter('outlier')"
      >
        <span class="cl__dot cl__dot--orange" />
        Выброс IQR <span class="cl__filter-count">{{ counts.outlier }}</span>
      </button>
    </div>

    <!-- Список -->
    <div v-if="!store.isLoading && filtered.length === 0" class="cl__empty">
      Контракты не найдены
    </div>

    <div v-else-if="!store.isLoading" class="cl__list">
      <div
        v-for="c in filtered"
        :key="c.contractNumber"
        class="cl__card"
        :class="{
          'cl__card--outlier':        contractStatus(c) === 'outlier',
          'cl__card--force-included': contractStatus(c) === 'force_included',
        }"
        @click="router.push({ name: 'contract-detail', params: { number: c.contractNumber }, query: { steId: c.steNumber } })"
      >
        <!-- Акцентная полоса -->
        <div class="cl__card-accent" :class="{
          'cl__card-accent--green':  contractStatus(c) === 'used',
          'cl__card-accent--orange': contractStatus(c) === 'outlier',
          'cl__card-accent--teal':   contractStatus(c) === 'force_included',
        }" />

        <div class="cl__card-inner">

          <!-- Верх: мета + цена -->
          <div class="cl__card-row">

            <!-- Левая: номер, статус, поставщик, регион -->
            <div class="cl__card-left">
              <div class="cl__card-meta">
                <span class="cl__contract-num">{{ c.contractNumber }}</span>
                <span class="cl__status-badge" :class="STATUS_BADGE_CLS[contractStatus(c)]">
                  <span class="cl__status-dot" />
                  {{ STATUS_LABEL[contractStatus(c)] }}
                </span>
              </div>
              <div class="cl__date">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                  <path d="M4 1v2M8 1v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  <path d="M1 5h10" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                {{ formatDate(c.date) }}
              </div>
              <div class="cl__card-details">
                <div class="cl__detail">
                  <span class="cl__detail-label">Поставщик</span>
                  <span class="cl__detail-val">{{ c.supplier }}</span>
                </div>
                <div class="cl__detail">
                  <span class="cl__detail-label">Заказчик</span>
                  <span class="cl__detail-val">{{ c.customer }}</span>
                </div>
                <div class="cl__detail-row">
                  <span class="cl__tag">{{ c.region }}</span>
                  <span class="cl__tag">НДС {{ c.vatRate != null ? `${c.vatRate}%` : 'нет' }}</span>
                  <span class="cl__tag">{{ c.items.length }} поз.</span>
                </div>
              </div>
            </div>

            <!-- Правая: цена + итог -->
            <div class="cl__card-right">
              <div class="cl__price-area">
                <span class="cl__price-caption">за единицу</span>
                <div class="cl__price-row">
                  <span class="cl__price">{{ formatPrice(c.items[0]?.unitPrice) }}</span>
                  <span class="cl__price-sep">/</span>
                  <span class="cl__price-unit">{{ c.items[0]?.unit }}</span>
                </div>
              </div>
              <div class="cl__total-area">
                <span class="cl__price-caption">сумма контракта</span>
                <span class="cl__total">{{ formatPrice(contractTotal(c.items)) }}</span>
              </div>
            </div>
          </div>

          <!-- Статус-бар: только для выбросов -->
          <div
            v-if="contractStatus(c) !== 'used'"
            class="cl__action-bar"
            :class="`cl__action-bar--${contractStatus(c)}`"
            @click.stop
          >
            <div class="cl__action-reason">
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
              class="cl__include-btn"
              :class="{
                'cl__include-btn--add':    contractStatus(c) === 'outlier',
                'cl__include-btn--remove': contractStatus(c) === 'force_included',
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
        <div class="cl__card-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

      </div>
    </div>

    <!-- Диалог подтверждения пересчёта -->
    <Teleport to="body">
      <Transition name="cl-modal">
        <div v-if="confirmTarget" class="cl__overlay" @click.self="confirmTarget = null">
          <div class="cl__dialog">
            <div class="cl__dialog-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="currentColor" stroke-width="1.6"/>
                <path d="M11 7v5M11 15v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="cl__dialog-body">
              <p class="cl__dialog-title">Будет выполнен пересчёт НМЦК</p>
              <p class="cl__dialog-sub">{{ CONFIRM_SUB[contractStatus(confirmTarget)] }}</p>
            </div>
            <div class="cl__dialog-actions">
              <button class="cl__dialog-cancel" @click="confirmTarget = null">Отмена</button>
              <button class="cl__dialog-confirm" @click="doConfirm">Пересчитать</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.cl {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.cl__back {
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
.cl__back:hover { text-decoration: underline; }

.cl__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cl__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.cl__applied-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: 4px;
}

.cl__af-tag {
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

.cl__af-key {
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
}

.cl__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.cl__ste-link {
  font-family: monospace;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(38,75,130,0.35);
  text-underline-offset: 2px;
}
.cl__ste-link:hover {
  text-decoration-color: var(--color-main-blue);
}

.cl__badge {
  padding: 5px 14px;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  white-space: nowrap;
}

/* ===== Фильтры ===== */
.cl__filters {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.cl__filter-btn {
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
  transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}

.cl__filter-btn:hover {
  border-color: var(--color-main-blue);
  color: var(--color-main-blue);
}

.cl__filter-btn--active {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
  color: var(--color-main-blue);
}

.cl__filter-count {
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  opacity: 0.7;
}

.cl__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cl__dot--green  { background: var(--color-green); }
.cl__dot--orange { background: #e8920a; }

/* ===== Список ===== */
.cl__empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-pale-black);
  font-size: var(--font-size-md);
}

.cl__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ===== Карточка ===== */
.cl__card {
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
.cl__card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.cl__card--outlier        { background: #fffcf5; }
.cl__card--force-included { background: #f0faf6; }
.cl__card--force-excluded { background: #fff5f5; }

.cl__card-accent {
  width: 4px;
  flex-shrink: 0;
}
.cl__card-accent--green  { background: #0d9b68; }
.cl__card-accent--orange { background: #f9c56a; }
.cl__card-accent--teal   { background: #167c85; }
.cl__card-accent--red    { background: #d94f4f; }

.cl__card-inner {
  flex: 1;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.cl__card-arrow {
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  color: var(--color-gray-light);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.cl__card:hover .cl__card-arrow { color: var(--color-main-blue); }

/* Основная строка карточки */
.cl__card-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
}

.cl__card-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.cl__card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cl__contract-num {
  font-family: monospace;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  letter-spacing: 0.02em;
}

.cl__status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.cl__status-badge--green  { color: #0d9b68; background: #e6f5ee; }
.cl__status-badge--orange { color: #c27000; background: #fff6e4; }
.cl__status-badge--teal   { color: #167c85; background: #e4f4f5; }
.cl__status-badge--red    { color: #c0392b; background: #fdecea; }

.cl__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.cl__date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  white-space: nowrap;
}

.cl__card-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cl__detail {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cl__detail-label {
  font-size: 10px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cl__detail-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cl__detail-row {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  margin-top: 2px;
}

.cl__tag {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 1px 8px;
  white-space: nowrap;
}

/* Правая: цена */
.cl__card-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: var(--space-2);
  text-align: right;
}

.cl__price-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cl__price-caption {
  font-size: 10px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cl__price-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.cl__price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  white-space: nowrap;
}

.cl__price-sep {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.cl__price-unit {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.cl__total-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-gray-blue);
  width: 100%;
}

.cl__total {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  white-space: nowrap;
}

/* Статус-бар (отображается для всех статусов) */
.cl__action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}
.cl__action-bar--used           { background: #eef4fb; }
.cl__action-bar--outlier        { background: #fff8ed; }
.cl__action-bar--force_included { background: #e8f7f0; }
.cl__action-bar--force_excluded { background: #fdecea; }

.cl__action-reason {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}
.cl__action-bar--used           .cl__action-reason { color: #2a5298; }
.cl__action-bar--outlier        .cl__action-reason { color: #7a4400; }
.cl__action-bar--force_included .cl__action-reason { color: #0d6b52; }
.cl__action-bar--force_excluded .cl__action-reason { color: #a03030; }

/* Кнопка действия */
.cl__include-btn {
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
/* Зелёная (добавить в расчёт): outlier + force_excluded */
.cl__include-btn--add    { color: #0d6b52; background: #d4f5e4; border-color: #0d9b68; }
.cl__include-btn--add:hover { background: #b8edce; border-color: #0a7a52; }
/* Красная (убрать из расчёта): used + force_included */
.cl__include-btn--remove { color: #a03030; background: #fce8e8; border-color: #d94f4f; }
.cl__include-btn--remove:hover { background: #f8d0d0; border-color: #b03030; }

/* Диалог подтверждения */
.cl__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.cl__dialog {
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
.cl__dialog-icon { color: var(--color-main-blue); display: flex; }
.cl__dialog-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: 4px;
}
.cl__dialog-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  line-height: 1.5;
}
.cl__dialog-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
.cl__dialog-cancel {
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
.cl__dialog-cancel:hover { background: #dce8f5; }
.cl__dialog-confirm {
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
.cl__dialog-confirm:hover { opacity: 0.88; }

.cl-modal-enter-active { transition: opacity 180ms ease; }
.cl-modal-leave-active { transition: opacity 150ms ease; }
.cl-modal-enter-from, .cl-modal-leave-to { opacity: 0; }

/* ── Загрузка ── */
.cl__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}
.cl__spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: cl-spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes cl-spin { to { transform: rotate(360deg); } }
.cl__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}
.cl__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}
</style>
