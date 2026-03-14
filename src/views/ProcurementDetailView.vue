<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePriceStore } from "../stores/priceStore.js";
import {
  usePriceCalculation,
  formatPrice,
  formatDate,
} from "../composables/usePriceCalculation.js";
import AppButton from "../components/ui/AppButton.vue";

const router = useRouter();
const route = useRoute();
const store = usePriceStore();

// Если нет данных — гоним на главную
if (!store.hasSearched) {
  router.replace("/");
}

// Статистика по всей выборке нужна для контекста
const {
  processedProcurements,
  validProcurements,
  weightedAvgUnitPrice,
  statistics,
} = usePriceCalculation(
  computed(() => store.procurements),
  computed(() => store.filters),
  computed(() => store.requestedQty)
);

// Находим конкретную закупку по id из URL
const procurement = computed(
  () =>
    processedProcurements.value.find((p) => p.id === route.params.id) ??
    store.procurements.find((p) => p.id === route.params.id)
);

// Статус закупки для отображения бейджа
const statusMap = {
  excluded: { label: "Исключено", color: "#8c8c8c", bg: "#f5f5f5" },
  outlier: { label: "Выброс IQR", color: "#c27000", bg: "#fff6e4" },
  manual: { label: "Вручную", color: "#167c85", bg: "#e4f4f5" },
  active: { label: "Учтено", color: "#0d9b68", bg: "#e6f5ee" },
};

const status = computed(() => {
  const p = procurement.value;
  if (!p) return statusMap.active;
  if (p.isExcluded) return statusMap.excluded;
  if (p.isOutlier) return statusMap.outlier;
  if (p.manualPrice) return statusMap.manual;
  return statusMap.active;
});

// Отклонение цены от средневзвешенной по выборке (в процентах)
const deviation = computed(() => {
  const avg = weightedAvgUnitPrice.value;
  const price = procurement.value?.unitPrice;
  if (!avg || !price) return null;
  return ((price - avg) / avg) * 100;
});

// Позиция цены среди всех учтённых закупок (процентиль)
const priceRank = computed(() => {
  const prices = validProcurements.value
    .map((p) => p.unitPrice)
    .sort((a, b) => a - b);
  const price = procurement.value?.unitPrice;
  if (!prices.length || !price) return null;
  const below = prices.filter((v) => v < price).length;
  return Math.round((below / prices.length) * 100);
});

function toggleExclude() {
  store.toggleExclude(procurement.value.id);
}

const isManualEntry = computed(() => procurement.value?.id?.startsWith("MAN-"));
</script>

<template>
  <div class="detail">
    <!-- Закупка не найдена -->
    <div v-if="!procurement" class="detail__not-found container">
      <p class="detail__not-found-title">Закупка не найдена</p>
      <p class="detail__not-found-sub">Возможно, данные сессии были сброшены</p>
      <AppButton variant="primary" @click="router.replace('/')"
        >На главную</AppButton
      >
    </div>

    <template v-else>
      <!-- ===== Шапка ===== -->
      <div class="detail__header-wrap">
        <div class="container">
          <div class="detail__header">
            <!-- Навигация и заголовок -->
            <div class="detail__header-left">
              <button class="detail__back" @click="router.back()">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 3L5 8l5 5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Назад к результатам
              </button>

              <div class="detail__title-row">
                <h1 class="detail__title">{{ procurement.name }}</h1>
                <div class="detail__badges">
                  <span
                    v-if="isManualEntry"
                    class="detail__badge detail__badge--manual"
                    >Ручной ввод</span
                  >
                  <span
                    class="detail__badge"
                    :style="{ color: status.color, background: status.bg }"
                  >
                    <span
                      class="detail__badge-dot"
                      :style="{ background: status.color }"
                    />
                    {{ status.label }}
                  </span>
                </div>
              </div>

              <p class="detail__subtitle">
                Закупка&nbsp;№&nbsp;<strong>{{ procurement.steNumber }}</strong>
                &nbsp;·&nbsp;{{ procurement.id }}
              </p>
            </div>

            <!-- Главная цена -->
            <div class="detail__price-block">
              <span class="detail__price-label">Цена за единицу</span>
              <span class="detail__price">{{
                formatPrice(procurement.unitPrice)
              }}</span>
              <span class="detail__price-unit">/ {{ procurement.unit }}</span>

              <!-- Отклонение от средней -->
              <span
                v-if="deviation !== null"
                class="detail__deviation"
                :class="{
                  'detail__deviation--up': deviation > 5,
                  'detail__deviation--down': deviation < -5,
                  'detail__deviation--ok': Math.abs(deviation) <= 5,
                }"
              >
                {{ deviation > 0 ? "+" : "" }}{{ deviation.toFixed(1) }}% от
                средней
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Тело ===== -->
      <div class="container detail__body">
        <div class="detail__layout">
          <!-- ─── Левая колонка ─── -->
          <div class="detail__main">
            <!-- Основные данные -->
            <section class="detail__card">
              <h2 class="detail__card-title">Данные закупки</h2>

              <div class="detail__grid">
                <div class="detail__field" style="grid-column: 1 / -1">
                  <span class="detail__field-label"
                    >Реестровый номер контракта</span
                  >
                  <span class="detail__field-value detail__field-value--mono">{{
                    procurement.contractNumber ?? "—"
                  }}</span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Поставщик</span>
                  <span class="detail__field-value">{{
                    procurement.supplier
                  }}</span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Заказчик</span>
                  <span class="detail__field-value">{{
                    procurement.customer
                  }}</span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Регион поставщика</span>
                  <span class="detail__field-value">
                    <svg
                      width="11"
                      height="13"
                      viewBox="0 0 11 13"
                      fill="none"
                      style="flex-shrink: 0"
                    >
                      <path
                        d="M5.5 1C3.57 1 2 2.57 2 4.5c0 2.6 3.5 8 3.5 8s3.5-5.4 3.5-8C9 2.57 7.43 1 5.5 1z"
                        stroke="currentColor"
                        stroke-width="1.2"
                      />
                    </svg>
                    {{ procurement.supplierRegion || procurement.region }}
                  </span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Дата закупки</span>
                  <span class="detail__field-value">{{
                    formatDate(procurement.date)
                  }}</span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Количество</span>
                  <span class="detail__field-value"
                    >{{ procurement.quantity }}&nbsp;{{
                      procurement.unit
                    }}</span
                  >
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Правовая база</span>
                  <span class="detail__field-value">{{ procurement.law }}</span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label"
                    >Цена за единицу (без НДС)</span
                  >
                  <span
                    class="detail__field-value detail__field-value--accent"
                    >{{ formatPrice(procurement.unitPrice) }}</span
                  >
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Ставка НДС</span>
                  <span class="detail__field-value detail__field-value--vat">
                    {{
                      procurement.vatRate != null
                        ? `${procurement.vatRate}%`
                        : "Без НДС"
                    }}
                  </span>
                </div>
                <div v-if="procurement.priceWithVat" class="detail__field">
                  <span class="detail__field-label">Цена с НДС</span>
                  <span class="detail__field-value detail__field-value--bold">{{
                    formatPrice(procurement.priceWithVat)
                  }}</span>
                </div>
                <div class="detail__field">
                  <span class="detail__field-label">Итоговая стоимость</span>
                  <span class="detail__field-value detail__field-value--bold">{{
                    formatPrice(procurement.totalPrice)
                  }}</span>
                </div>
              </div>
            </section>

            <!-- Контекст в выборке -->
            <section class="detail__card">
              <h2 class="detail__card-title">Место в выборке</h2>

              <!-- Прогресс-бар позиции цены -->
              <div v-if="priceRank !== null" class="detail__rank">
                <div class="detail__rank-labels">
                  <span>{{ formatPrice(statistics.minPrice) }}</span>
                  <span class="detail__rank-center">
                    Эта цена выше {{ priceRank }}% источников
                  </span>
                  <span>{{ formatPrice(statistics.maxPrice) }}</span>
                </div>
                <div class="detail__rank-bar">
                  <!-- IQR-диапазон (нормальный коридор) -->
                  <div
                    class="detail__rank-iqr"
                    :style="{
                      left:
                        ((statistics.q1 - statistics.minPrice) /
                          (statistics.maxPrice - statistics.minPrice)) *
                          100 +
                        '%',
                      width:
                        ((statistics.q3 - statistics.q1) /
                          (statistics.maxPrice - statistics.minPrice)) *
                          100 +
                        '%',
                    }"
                  />
                  <!-- Средняя -->
                  <div
                    class="detail__rank-avg"
                    :style="{
                      left:
                        ((weightedAvgUnitPrice - statistics.minPrice) /
                          (statistics.maxPrice - statistics.minPrice)) *
                          100 +
                        '%',
                    }"
                  />
                  <!-- Текущая цена -->
                  <div
                    class="detail__rank-marker"
                    :class="{
                      'detail__rank-marker--outlier': procurement.isOutlier,
                    }"
                    :style="{
                      left:
                        Math.max(
                          0,
                          Math.min(
                            100,
                            ((procurement.unitPrice - statistics.minPrice) /
                              (statistics.maxPrice - statistics.minPrice)) *
                              100
                          )
                        ) + '%',
                    }"
                  />
                </div>
                <div class="detail__rank-legend">
                  <span class="detail__rank-legend-item">
                    <span
                      class="detail__rank-legend-dot detail__rank-legend-dot--iqr"
                    />
                    IQR-диапазон
                  </span>
                  <span class="detail__rank-legend-item">
                    <span
                      class="detail__rank-legend-dot detail__rank-legend-dot--avg"
                    />
                    Средняя
                  </span>
                  <span class="detail__rank-legend-item">
                    <span
                      class="detail__rank-legend-dot detail__rank-legend-dot--marker"
                    />
                    Эта закупка
                  </span>
                </div>
              </div>

              <!-- Сравнение со средними -->
              <div class="detail__compare">
                <div class="detail__compare-item">
                  <span class="detail__compare-label">Средневзвешенная</span>
                  <span class="detail__compare-value">{{
                    formatPrice(weightedAvgUnitPrice)
                  }}</span>
                </div>
                <div class="detail__compare-item">
                  <span class="detail__compare-label">Медиана</span>
                  <span class="detail__compare-value">{{
                    formatPrice(statistics.medianPrice)
                  }}</span>
                </div>
                <div class="detail__compare-item">
                  <span class="detail__compare-label">Q1 (25%)</span>
                  <span class="detail__compare-value">{{
                    formatPrice(statistics.q1)
                  }}</span>
                </div>
                <div class="detail__compare-item">
                  <span class="detail__compare-label">Q3 (75%)</span>
                  <span class="detail__compare-value">{{
                    formatPrice(statistics.q3)
                  }}</span>
                </div>
              </div>
            </section>

            <!-- Предупреждение о выбросе -->
            <div
              v-if="procurement.isOutlier && !procurement.isExcluded"
              class="detail__outlier-warn"
            >
              <svg width="16" height="15" viewBox="0 0 16 15" fill="none">
                <path
                  d="M8 .5L15.5 13.5H.5L8 .5z"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 5v4M8 11v.4"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                />
              </svg>
              <div>
                <p class="detail__outlier-warn-title">Выброс по методу IQR</p>
                <p class="detail__outlier-warn-text">
                  Цена выходит за допустимый статистический диапазон [{{
                    formatPrice(statistics.q1)
                  }}
                  — {{ formatPrice(statistics.q3) }}] и автоматически исключена
                  из расчёта НМЦК.
                </p>
              </div>
            </div>
          </div>

          <!-- ─── Правая колонка ─── -->
          <aside class="detail__sidebar">
            <!-- Действия -->
            <section class="detail__card detail__card--actions">
              <h2 class="detail__card-title">Действия</h2>

              <div class="detail__action-btns">
                <button
                  class="detail__action-btn"
                  :class="{
                    'detail__action-btn--restore': procurement.isExcluded,
                  }"
                  @click="toggleExclude"
                >
                  <svg
                    v-if="!procurement.isExcluded"
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                  >
                    <circle
                      cx="6.5"
                      cy="6.5"
                      r="5.5"
                      stroke="currentColor"
                      stroke-width="1.3"
                    />
                    <path
                      d="M3.5 6.5L5.5 9l4-5"
                      stroke="currentColor"
                      stroke-width="1.3"
                      stroke-linecap="round"
                    />
                  </svg>
                  <svg
                    v-else
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                  >
                    <circle
                      cx="6.5"
                      cy="6.5"
                      r="5.5"
                      stroke="currentColor"
                      stroke-width="1.3"
                    />
                    <path
                      d="M4 4l5 5M9 4l-5 5"
                      stroke="currentColor"
                      stroke-width="1.3"
                      stroke-linecap="round"
                    />
                  </svg>
                  {{
                    procurement.isExcluded
                      ? "Включить в расчёт"
                      : "Исключить из расчёта"
                  }}
                </button>
              </div>
            </section>

            <!-- Статистика выборки -->
            <section class="detail__card">
              <h2 class="detail__card-title">Статистика выборки</h2>
              <div class="detail__stats">
                <div class="detail__stat">
                  <span class="detail__stat-label">Всего источников</span>
                  <span class="detail__stat-value">{{
                    statistics.count +
                    statistics.outlierCount +
                    statistics.excludedCount
                  }}</span>
                </div>
                <div class="detail__stat">
                  <span class="detail__stat-label">Учтено в расчёте</span>
                  <span class="detail__stat-value detail__stat-value--green">{{
                    statistics.count
                  }}</span>
                </div>
                <div class="detail__stat">
                  <span class="detail__stat-label">Выбросов IQR</span>
                  <span class="detail__stat-value detail__stat-value--orange">{{
                    statistics.outlierCount
                  }}</span>
                </div>
                <div class="detail__stat">
                  <span class="detail__stat-label">Исключено вручную</span>
                  <span class="detail__stat-value detail__stat-value--gray">{{
                    statistics.excludedCount
                  }}</span>
                </div>
                <hr class="detail__stat-divider" />
                <div class="detail__stat">
                  <span class="detail__stat-label">Мин. цена</span>
                  <span class="detail__stat-value">{{
                    formatPrice(statistics.minPrice)
                  }}</span>
                </div>
                <div class="detail__stat">
                  <span class="detail__stat-label">Макс. цена</span>
                  <span class="detail__stat-value">{{
                    formatPrice(statistics.maxPrice)
                  }}</span>
                </div>
                <div class="detail__stat">
                  <span class="detail__stat-label">Средневзвешенная</span>
                  <span class="detail__stat-value detail__stat-value--blue">{{
                    formatPrice(weightedAvgUnitPrice)
                  }}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail {
  min-height: calc(100vh - 120px);
  background: #fff;
}

/* ===== Не найдено ===== */
.detail__not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.detail__not-found-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.detail__not-found-sub {
  font-size: var(--font-size-base);
  color: var(--color-pale-black);
}

/* ===== Шапка ===== */
.detail__header-wrap {
  background: #fff;
  border-bottom: 1px solid var(--color-gray-blue);
  padding: var(--space-5) 0 var(--space-4);
}

.detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.detail__header-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.detail__back {
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
  margin-bottom: var(--space-1);
}

.detail__back:hover {
  text-decoration: underline;
}

.detail__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.detail__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.2;
  margin: 0;
}

.detail__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  flex-shrink: 0;
}

.detail__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.detail__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.detail__badge--law {
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
}
.detail__badge--manual {
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
  border: 1px solid var(--color-gray-blue);
}

.detail__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

/* Цена в шапке */
.detail__price-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.detail__price-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail__price {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.1;
}

.detail__price-unit {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.detail__deviation {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-top: 4px;
}

.detail__deviation--up {
  background: #fdecea;
  color: var(--color-red);
}
.detail__deviation--down {
  background: #e6f5ee;
  color: var(--color-green);
}
.detail__deviation--ok {
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
}

/* ===== Тело ===== */
.detail__body {
  padding-top: var(--space-5);
  padding-bottom: var(--space-12);
}

.detail__layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-6);
  align-items: start;
}

.detail__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ===== Карточка ===== */
.detail__card {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: var(--space-5);
}

.detail__card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 var(--space-4) 0;
}

/* ===== Поля данных ===== */
.detail__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-1) var(--space-6);
}

.detail__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-3) 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail__field:last-child,
.detail__field:nth-last-child(2):nth-child(odd) {
  border-bottom: none;
}

.detail__field-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail__field-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-base);
  color: var(--color-black);
  font-weight: var(--font-weight-regular);
}

.detail__field-value--accent {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}
.detail__field-value--bold {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
}
.detail__field-value--mono {
  font-family: monospace;
  font-size: var(--font-size-sm);
  letter-spacing: 0.03em;
  color: var(--color-pale-black);
}
.detail__field-value--vat {
  color: var(--color-sea-dark);
  font-weight: var(--font-weight-semibold);
}

/* ===== Место в выборке ===== */
.detail__rank {
  margin-bottom: var(--space-4);
}

.detail__rank-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  margin-bottom: var(--space-2);
}

.detail__rank-center {
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.detail__rank-bar {
  position: relative;
  height: 10px;
  background: #f0f2f5;
  border-radius: var(--radius-full);
  overflow: visible;
}

/* IQR-коридор */
.detail__rank-iqr {
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--color-pale-blue);
  border-radius: var(--radius-full);
}

/* Маркер средней */
.detail__rank-avg {
  position: absolute;
  top: -3px;
  transform: translateX(-50%);
  width: 2px;
  height: 16px;
  background: var(--color-main-blue);
  border-radius: 1px;
}

/* Маркер текущей цены */
.detail__rank-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #fff;
  border: 2.5px solid var(--color-main-blue);
  border-radius: 50%;
  z-index: 1;
  box-shadow: 0 1px 4px rgba(38, 75, 130, 0.25);
}

.detail__rank-marker--outlier {
  border-color: #c27000;
}

.detail__rank-legend {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-3);
}

.detail__rank-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.detail__rank-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.detail__rank-legend-dot--iqr {
  background: var(--color-pale-blue);
}
.detail__rank-legend-dot--avg {
  background: var(--color-main-blue);
  width: 2px;
  height: 12px;
  border-radius: 1px;
}
.detail__rank-legend-dot--marker {
  background: #fff;
  border: 2px solid var(--color-main-blue);
  border-radius: 50%;
}

/* Сравнение -->  */
.detail__compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-1) var(--space-4);
}

.detail__compare-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail__compare-item:last-child,
.detail__compare-item:nth-last-child(2):nth-child(odd) {
  border-bottom: none;
}

.detail__compare-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.detail__compare-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

/* ===== Предупреждение выброса ===== */
.detail__outlier-warn {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: #fff8ed;
  border: 1px solid #f9c56a;
  border-radius: var(--radius-md);
  color: #7a4400;
}

.detail__outlier-warn-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 4px;
}

.detail__outlier-warn-text {
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

/* ===== Sidebar ===== */
.detail__sidebar {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ===== Действия ===== */
.detail__card--actions {
  border-color: var(--color-gray-blue);
}

.detail__action-btns {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail__action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: background var(--transition-fast),
    border-color var(--transition-fast);
}

.detail__action-btn:hover {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
}

.detail__action-btn--restore {
  color: var(--color-green);
}
.detail__action-btn--restore:hover {
  background: #e6f5ee;
  border-color: var(--color-green);
}

/* Форма редактирования */
.detail__edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail__edit-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
}

.detail__edit-input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid var(--color-main-blue);
  border-radius: var(--radius-base);
  overflow: hidden;
  box-shadow: 0 0 0 3px rgba(38, 75, 130, 0.08);
}

.detail__edit-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  border: none;
  outline: none;
  background: transparent;
}

.detail__edit-currency {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  padding: 0 12px;
  border-left: 1px solid var(--color-gray-blue);
  height: 40px;
  display: flex;
  align-items: center;
  background: var(--color-pale-blue);
  white-space: nowrap;
}

.detail__edit-btns {
  display: flex;
  gap: var(--space-2);
}

.detail__edit-save,
.detail__edit-cancel {
  flex: 1;
  height: 38px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-base);
  cursor: pointer;
  border: none;
  transition: background var(--transition-fast);
}

.detail__edit-save {
  background: var(--color-main-blue);
  color: #fff;
}

.detail__edit-save:hover {
  background: #1a3660;
}

.detail__edit-cancel {
  background: none;
  color: var(--color-pale-black);
  border: 1px solid var(--color-gray-blue);
}

.detail__edit-cancel:hover {
  background: var(--color-gray-blue);
  color: var(--color-black);
}

/* ===== Статистика ===== */
.detail__stats {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail__stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail__stat:last-child {
  border-bottom: none;
}

.detail__stat-divider {
  border: none;
  border-top: 1px solid var(--color-gray-blue);
  margin: var(--space-1) 0;
}

.detail__stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.detail__stat-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.detail__stat-value--green {
  color: var(--color-green);
}
.detail__stat-value--orange {
  color: var(--color-orange);
}
.detail__stat-value--gray {
  color: var(--color-pale-black);
}
.detail__stat-value--blue {
  color: var(--color-main-blue);
}

/* ===== Анимация формы ===== */
.detail-edit-enter-active,
.detail-edit-leave-active {
  transition: max-height 220ms ease, opacity 180ms ease;
  overflow: hidden;
  max-height: 300px;
}

.detail-edit-enter-from,
.detail-edit-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ===== Адаптив ===== */
@media (max-width: 1024px) {
  .detail__layout {
    grid-template-columns: 1fr;
  }
  .detail__sidebar {
    position: static;
    order: -1;
  }
}

@media (max-width: 768px) {
  .detail__header {
    flex-direction: column;
  }
  .detail__price-block {
    align-items: flex-start;
  }
  .detail__grid {
    grid-template-columns: 1fr;
  }
  .detail__compare {
    grid-template-columns: 1fr;
  }
  .detail__title {
    font-size: var(--font-size-xl);
  }
  .detail__price {
    font-size: var(--font-size-2xl);
  }
  .detail__rank-labels {
    flex-direction: column;
    gap: 2px;
  }
  .detail__rank-center {
    order: -1;
  }
}
</style>
