<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatPrice, formatDate } from '../../composables/usePriceCalculation.js'

const router = useRouter()

const props = defineProps({
  procurement: { type: Object, required: true },
  index:       { type: Number, default: 0 },
})

const emit = defineEmits(['toggle-exclude', 'toggle-include'])

const statusMap = {
  excluded: { label: 'Исключено',   color: '#8c8c8c', bg: '#f5f5f5', border: '#c0c0c0' },
  outlier:  { label: 'Выброс IQR',  color: '#c27000', bg: '#fff6e4', border: '#f9c56a' },
  manual:   { label: 'Вручную',     color: '#167c85', bg: '#e4f4f5', border: '#48b8c2' },
  active:   { label: 'Учтено',      color: '#0d9b68', bg: '#e6f5ee', border: '#0d9b68' },
}

const status = computed(() => {
  const p = props.procurement
  if (p.isExcluded)  return statusMap.excluded
  if (p.isOutlier)   return statusMap.outlier
  if (p.manualPrice) return statusMap.manual
  return statusMap.active
})

const isManualEntry = computed(() => props.procurement.id.startsWith('MAN-'))

function goToDetail() {
  router.push({ name: 'procurement-detail', params: { id: props.procurement.id } })
}

function goToContract() {
  router.push({ name: 'contract-detail', params: { number: props.procurement.contractNumber } })
}
</script>

<template>
  <div
    class="prc"
    :class="{
      'prc--excluded': procurement.isExcluded,
      'prc--outlier':  procurement.isOutlier && !procurement.isExcluded,
    }"
    :style="{ '--accent': status.border }"
  >
    <div class="prc__accent" />

    <div class="prc__inner">

      <!-- Верхняя строка -->
      <div class="prc__top">
        <div class="prc__meta">
          <span class="prc__num">{{ index + 1 }}</span>
          <!-- Клик по номеру — переход в детали -->
          <button class="prc__id prc__link" @click="goToDetail">
            СТЕ&nbsp;{{ procurement.steNumber }}
          </button>
          <button v-if="procurement.contractNumber && !isManualEntry" class="prc__contract prc__contract--link" @click="goToContract">
            {{ procurement.contractNumber }}
          </button>
          <span v-if="isManualEntry" class="prc__badge-manual">Ручной ввод</span>
          <span class="prc__status" :style="{ color: status.color, background: status.bg }">
            <span class="prc__status-dot" :style="{ background: status.color }" />
            {{ status.label }}
          </span>
        </div>

        <div class="prc__price-area">
          <span class="prc__price">{{ formatPrice(procurement.unitPrice) }}</span>
          <span class="prc__price-unit">&nbsp;/&nbsp;{{ procurement.unit }}</span>
        </div>
      </div>

      <!-- Тело карточки -->
      <div class="prc__body">
        <div class="prc__info">
          <!-- Клик по названию — переход в детали -->
          <button class="prc__name prc__link" @click="goToDetail">{{ procurement.name }}</button>
          <div class="prc__parties">
            <span class="prc__party">
              <span class="prc__party-label">Поставщик</span>
              {{ procurement.supplier }}
            </span>
            <span class="prc__party-sep">·</span>
            <span class="prc__party">
              <span class="prc__party-label">Заказчик</span>
              {{ procurement.customer }}
            </span>
          </div>
        </div>

        <div class="prc__right">
          <div class="prc__details">
            <span class="prc__detail">
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
                <path d="M5.5 1C3.57 1 2 2.57 2 4.5c0 2.6 3.5 8 3.5 8s3.5-5.4 3.5-8C9 2.57 7.43 1 5.5 1z" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              {{ procurement.region }}
            </span>
            <span class="prc__detail">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <path d="M3.5 1v2M8.5 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ formatDate(procurement.date) }}
            </span>
            <span class="prc__detail">{{ procurement.quantity }}&nbsp;{{ procurement.unit }}</span>
            <!-- НДС: ставка и цена с НДС -->
            <span class="prc__detail prc__detail--vat">
              {{ procurement.vatRate != null ? `НДС ${procurement.vatRate}%` : 'Без НДС' }}
            </span>
            <span v-if="procurement.priceWithVat" class="prc__detail prc__detail--vat-price">
              {{ formatPrice(procurement.priceWithVat) }}&nbsp;с&nbsp;НДС
            </span>
            <span class="prc__detail prc__detail--sum">{{ formatPrice(procurement.totalPrice) }}</span>
          </div>

          <div class="prc__actions">
            <button
              v-if="!procurement.isOutlier"
              class="prc__action"
              :class="{ 'prc__action--restore': procurement.isExcluded }"
              @click="$emit('toggle-exclude', procurement.id)"
            >
              <svg v-if="!procurement.isExcluded" width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M3 5.5l2 2 3-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <svg v-else width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M3.5 3.5l4 4M7.5 3.5l-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ procurement.isExcluded ? 'Включить в расчёт' : 'Исключить' }}
            </button>

            <button class="prc__action prc__action--detail" @click="goToDetail">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M6 1.5H2.5A1 1 0 0 0 1.5 2.5v6A1 1 0 0 0 2.5 9.5h6A1 1 0 0 0 9.5 8.5V5M7.5 1.5h2v2M5 6l4.5-4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Подробнее
            </button>
          </div>
        </div>
      </div>

      <!-- Пояснение выброса -->
      <div v-if="procurement.isOutlier && !procurement.isExcluded" class="prc__outlier-note">
        <div class="prc__outlier-text">
          <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
            <path d="M6.5.5L12.5 11H.5L6.5.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M6.5 4.5v3M6.5 9v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          Выброс IQR — не учитывается в расчёте НМЦ
        </div>
        <button
          class="prc__outlier-include"
          :class="{ 'prc__outlier-include--active': procurement.manualInclude }"
          @click="$emit('toggle-include', procurement.id)"
        >
          {{ procurement.manualInclude ? 'Убрать из расчёта' : 'Включить в расчёт' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.prc {
  display: flex;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-left: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.prc:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.prc--excluded { opacity: 0.55; background: #fafafa; }
.prc--outlier  { background: #fffcf5; }

.prc__accent {
  width: 4px;
  flex-shrink: 0;
  background: var(--accent, #d4dbe6);
}

.prc__inner {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

/* Верхняя строка */
.prc__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.prc__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.prc__num {
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.prc__id {
  font-size: var(--font-size-sm);
  color: var(--color-main-blue);
  text-decoration: underline;
  text-decoration-color: rgba(38,75,130,0.35);
  text-underline-offset: 2px;
}

/* Кликабельные элементы — номер и название */
.prc__link {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-family);
  cursor: pointer;
  text-align: left;
  color: var(--color-main-blue);
  text-decoration: underline;
  text-decoration-color: rgba(38,75,130,0.3);
  text-underline-offset: 2px;
  transition: text-decoration-color var(--transition-fast);
}

.prc__link:hover {
  text-decoration-color: var(--color-main-blue);
}

/* Название */
.prc__name.prc__link {
  color: var(--color-main-blue);
  text-decoration-color: rgba(38,75,130,0.3);
}

.prc__name.prc__link:hover {
  text-decoration-color: var(--color-main-blue);
}

/* Реестровый номер контракта — кнопка-ссылка */
.prc__contract--link {
  font-family: monospace;
  font-size: var(--font-size-xs);
  letter-spacing: 0.02em;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-main-blue);
  text-decoration: underline;
  text-decoration-color: rgba(38,75,130,0.3);
  text-underline-offset: 2px;
  cursor: pointer;
  transition: background var(--transition-fast), text-decoration-color var(--transition-fast);
}

.prc__contract--link:hover {
  background: #dce8f5;
  text-decoration-color: var(--color-main-blue);
}


.prc__badge-manual {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
}

.prc__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.prc__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Цена */
.prc__price-area {
  flex-shrink: 0;
  text-align: right;
}

.prc__price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  white-space: nowrap;
}

.prc__price-unit {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

/* Тело */
.prc__body {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.prc__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.prc__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  line-height: 1.4;
}

.prc__parties {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.prc__party {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  white-space: nowrap;
}

.prc__party-label {
  font-size: var(--font-size-xs);
  color: var(--color-gray);
  margin-right: 3px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.prc__party-sep {
  color: var(--color-gray-blue);
}

/* Правая панель */
.prc__right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.prc__details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
}

.prc__detail {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  white-space: nowrap;
}

.prc__detail--sum {
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  padding-left: var(--space-2);
  border-left: 1px solid var(--color-gray-blue);
}

/* НДС */
.prc__detail--vat {
  color: var(--color-sea-dark);
  font-weight: var(--font-weight-semibold);
}

.prc__detail--vat-price {
  color: var(--color-pale-black);
}

/* Действия */
.prc__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.prc__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  padding: 4px 10px;
  white-space: nowrap;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.prc__action:hover {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
}

.prc__action--restore { color: var(--color-green); }
.prc__action--restore:hover {
  background: #e6f5ee;
  border-color: var(--color-green);
}

.prc__action--detail { color: var(--color-pale-black); }
.prc__action--detail:hover {
  background: #f5f5f5;
  border-color: var(--color-gray);
  color: var(--color-black);
}

/* Выброс */
.prc__outlier-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: #fff8ed;
  border-radius: var(--radius-sm);
}

.prc__outlier-text {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: #7a4400;
  line-height: 1.4;
  flex-shrink: 0;
}

.prc__outlier-include {
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #c27000;
  background: #fff0cc;
  border: 1px solid #f5c96a;
  border-radius: var(--radius-base);
  padding: 3px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.prc__outlier-include:hover {
  background: #ffe5a0;
  border-color: #e6a800;
}

.prc__outlier-include--active {
  color: #0d9b68;
  background: #e6f5ee;
  border-color: #0d9b68;
}

.prc__outlier-include--active:hover {
  background: #cceedd;
  border-color: #0a7a52;
}

@media (max-width: 768px) {
  .prc__body  { flex-direction: column; }
  .prc__right { align-items: flex-start; }
  .prc__details { justify-content: flex-start; }
  .prc__actions { justify-content: flex-start; }
}
</style>
