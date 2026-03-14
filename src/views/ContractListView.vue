<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceStore } from '../stores/priceStore.js'
import { formatPrice, formatDate } from '../composables/usePriceCalculation.js'

const router = useRouter()
const store  = usePriceStore()

if (!store.hasSearched) {
  router.replace('/')
}

// Группируем закупки по номеру контракта
const contracts = computed(() => {
  const map = new Map()
  for (const p of store.procurements) {
    if (!map.has(p.contractNumber)) {
      map.set(p.contractNumber, {
        contractNumber: p.contractNumber,
        supplier:       p.supplier,
        customer:       p.customer,
        region:         p.region,
        date:           p.date,
        vatRate:        p.vatRate,
        items:          [],
      })
    }
    map.get(p.contractNumber).items.push(p)
  }
  // Сортируем по дате — сначала новые
  return [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Сумма по контракту
function contractTotal(items) {
  return items.reduce((sum, p) => sum + p.totalPrice, 0)
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
        <p class="cl__eyebrow">СТЕ</p>
        <h1 class="cl__title">{{ store.steQuery }}</h1>
      </div>
      <div class="cl__badge">{{ contracts.length }} контрактов</div>
    </div>

    <!-- Список -->
    <div v-if="contracts.length === 0" class="cl__empty">Контракты не найдены</div>

    <div v-else class="cl__list">
      <button
        v-for="c in contracts"
        :key="c.contractNumber"
        class="cl__card"
        @click="router.push({ name: 'contract-detail', params: { number: c.contractNumber } })"
      >
        <!-- Номер + дата -->
        <div class="cl__card-top">
          <span class="cl__contract-num">{{ c.contractNumber }}</span>
          <span class="cl__date">{{ formatDate(c.date) }}</span>
        </div>

        <!-- Поставщик и заказчик -->
        <div class="cl__card-mid">
          <div class="cl__meta">
            <span class="cl__meta-label">Поставщик</span>
            <span class="cl__meta-val">{{ c.supplier }}</span>
          </div>
          <div class="cl__meta">
            <span class="cl__meta-label">Регион</span>
            <span class="cl__meta-val">{{ c.region }}</span>
          </div>
        </div>

        <!-- Позиции + сумма -->
        <div class="cl__card-bot">
          <span class="cl__items-count">{{ c.items.length }} поз.</span>
          <span class="cl__vat">НДС {{ c.vatRate != null ? `${c.vatRate}%` : 'нет' }}</span>
          <span class="cl__total">{{ formatPrice(contractTotal(c.items)) }}</span>
        </div>

        <!-- Стрелка -->
        <svg class="cl__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

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
  margin-bottom: var(--space-6);
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

.cl__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
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

.cl__empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-pale-black);
  font-size: var(--font-size-md);
}

/* Список карточек */
.cl__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Карточка контракта */
.cl__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  padding-right: 48px;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-family);
  width: 100%;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.cl__card:hover {
  border-color: var(--color-main-blue);
  box-shadow: var(--shadow-base);
}

.cl__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.cl__contract-num {
  font-family: monospace;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  letter-spacing: 0.03em;
}

.cl__date {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.cl__card-mid {
  display: flex;
  gap: var(--space-6);
}

.cl__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cl__meta-label {
  font-size: 11px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cl__meta-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.cl__card-bot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-gray-blue);
}

.cl__items-count {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 2px 8px;
  background: var(--color-pale-blue);
  border-radius: var(--radius-full);
}

.cl__vat {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.cl__total {
  margin-left: auto;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
}

.cl__arrow {
  position: absolute;
  right: var(--space-5);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-light);
  flex-shrink: 0;
}

.cl__card:hover .cl__arrow {
  color: var(--color-main-blue);
}
</style>
