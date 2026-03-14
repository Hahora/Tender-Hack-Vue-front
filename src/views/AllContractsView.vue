<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePriceStore } from "../stores/priceStore.js";
import { formatPrice, formatDate } from "../composables/usePriceCalculation.js";

const router = useRouter();
const route = useRoute();
const store = usePriceStore();

if (!store.hasSearched) {
  router.replace("/");
}

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
        region: p.region,
        date: p.date,
        vatRate: p.vatRate,
        items: [],
      });
    }
    map.get(p.contractNumber).items.push(p);
  }
  return [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
});

function contractStatus(c) {
  const hasActive = c.items.some((p) => !p.isOutlier || p.manualInclude);
  const hasOutlier = c.items.some((p) => p.isOutlier && !p.manualInclude);
  if (hasOutlier && !hasActive) return "outlier";
  if (hasOutlier && hasActive) return "mixed";
  return "active";
}

const filtered = computed(() => {
  if (activeFilters.value.size === 0) return contracts.value;
  return contracts.value.filter((c) => {
    const s = contractStatus(c);
    if (activeFilters.value.has("active") && (s === "active" || s === "mixed"))
      return true;
    if (
      activeFilters.value.has("outlier") &&
      (s === "outlier" || s === "mixed")
    )
      return true;
    return false;
  });
});

const counts = computed(() => ({
  all: contracts.value.length,
  active: contracts.value.filter((c) => contractStatus(c) !== "outlier").length,
  outlier: contracts.value.filter((c) => contractStatus(c) !== "active").length,
}));

function contractTotal(items) {
  return items.reduce((sum, p) => sum + p.totalPrice, 0);
}

function toggleContractInclude(c) {
  const allIncluded = c.items.every((p) => !p.isOutlier || p.manualInclude);
  for (const p of c.items) {
    if (p.isOutlier) {
      if (allIncluded) {
        if (p.manualInclude) store.toggleManualInclude(p.id);
      } else {
        if (!p.manualInclude) store.toggleManualInclude(p.id);
      }
    }
  }
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
      </div>
      <div class="ac__badge">{{ contracts.length }} контрактов</div>
    </div>

    <!-- Фильтр по статусу -->
    <div class="ac__filters">
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
    <div v-if="filtered.length === 0" class="ac__empty">
      Контракты не найдены
    </div>

    <div v-else class="ac__list">
      <div
        v-for="c in filtered"
        :key="c.contractNumber"
        class="ac__card"
        :class="{ 'ac__card--outlier': contractStatus(c) !== 'active' }"
        @click="
          router.push({
            name: 'contract-detail',
            params: { number: c.contractNumber },
          })
        "
      >
        <!-- Акцентная полоса -->
        <div
          class="ac__card-accent"
          :class="{
            'ac__card-accent--green': contractStatus(c) === 'active',
            'ac__card-accent--orange': contractStatus(c) !== 'active',
          }"
        />

        <div class="ac__card-inner">
          <div class="ac__card-row">
            <!-- Левая: мета + детали -->
            <div class="ac__card-left">
              <div class="ac__card-meta">
                <span class="ac__contract-num">{{ c.contractNumber }}</span>
                <span
                  class="ac__status-badge"
                  :class="{
                    'ac__status-badge--green': contractStatus(c) === 'active',
                    'ac__status-badge--orange': contractStatus(c) === 'outlier',
                    'ac__status-badge--teal': contractStatus(c) === 'mixed',
                  }"
                >
                  <span class="ac__status-dot" />
                  {{
                    contractStatus(c) === "active"
                      ? "Учтено"
                      : contractStatus(c) === "outlier"
                      ? "Выброс IQR"
                      : "Частично учтено"
                  }}
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
                  <span class="ac__tag"
                    >НДС {{ c.vatRate != null ? `${c.vatRate}%` : "нет" }}</span
                  >
                  <span class="ac__tag">{{ c.items.length }} поз.</span>
                  <button
                    class="ac__ste-tag"
                    @click.stop="router.push({ name: 'contracts' })"
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

          <!-- Выброс: причина + кнопка -->
          <div
            v-if="contractStatus(c) !== 'active'"
            class="ac__outlier-bar"
            @click.stop
          >
            <div class="ac__outlier-reason">
              <svg width="12" height="11" viewBox="0 0 13 12" fill="none">
                <path
                  d="M6.5.5L12.5 11H.5L6.5.5z"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linejoin="round"
                />
                <path
                  d="M6.5 4.5v3M6.5 9v.3"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              Цена выходит за пределы IQR — не учитывается в расчёте НМЦК
            </div>
            <button
              class="ac__include-btn"
              :class="{
                'ac__include-btn--active': c.items.some(
                  (p) => p.isOutlier && p.manualInclude
                ),
              }"
              @click.stop="toggleContractInclude(c)"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle
                  cx="5.5"
                  cy="5.5"
                  r="4.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                />
                <path
                  v-if="!c.items.some((p) => p.isOutlier && p.manualInclude)"
                  d="M3 5.5l2 2 3-3.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
                <path
                  v-else
                  d="M3.5 3.5l4 4M7.5 3.5l-4 4"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              {{
                c.items.some((p) => p.isOutlier && p.manualInclude)
                  ? "Убрать из расчёта"
                  : "Включить в расчёт"
              }}
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
  </div>
</template>

<style scoped>
.ac {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
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
.ac__card--outlier {
  background: #fffcf5;
}

.ac__card-accent {
  width: 4px;
  flex-shrink: 0;
}
.ac__card-accent--green {
  background: #0d9b68;
}
.ac__card-accent--orange {
  background: #f9c56a;
}

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
.ac__status-badge--green {
  color: #0d9b68;
  background: #e6f5ee;
}
.ac__status-badge--orange {
  color: #c27000;
  background: #fff6e4;
}
.ac__status-badge--teal {
  color: #167c85;
  background: #e4f4f5;
}

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

/* Строка выброса */
.ac__outlier-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: #fff8ed;
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}

.ac__outlier-reason {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: #7a4400;
  line-height: 1.4;
}

.ac__include-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #c27000;
  background: #fff0cc;
  border: 1px solid #f5c96a;
  border-radius: var(--radius-base);
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast),
    border-color var(--transition-fast);
  flex-shrink: 0;
}
.ac__include-btn:hover {
  background: #ffe5a0;
  border-color: #e6a800;
}
.ac__include-btn--active {
  color: #0d9b68;
  background: #e6f5ee;
  border-color: #0d9b68;
}
.ac__include-btn--active:hover {
  background: #cceedd;
  border-color: #0a7a52;
}
</style>
