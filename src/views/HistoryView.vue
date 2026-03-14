<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore.js'
import { formatPrice } from '../composables/usePriceCalculation.js'

const router = useRouter()
const cart   = useCartStore()

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function pluralPos(n) {
  if (n === 1) return 'позиция'
  if (n >= 2 && n <= 4) return 'позиции'
  return 'позиций'
}
</script>

<template>
  <div class="hist container">

    <!-- Навигация -->
    <button class="hist__back" @click="router.push({ name: 'cart' })">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      В корзину
    </button>

    <!-- Шапка -->
    <div class="hist__header">
      <div>
        <p class="hist__eyebrow">Закупочная документация</p>
        <h1 class="hist__title">История закупок</h1>
        <p v-if="cart.cartHistory.length" class="hist__subtitle">
          {{ cart.cartHistory.length }} завершённых закупок
        </p>
      </div>
    </div>

    <!-- Пусто -->
    <div v-if="cart.cartHistory.length === 0" class="hist__empty">
      <div class="hist__empty-icon">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2.2"/>
          <path d="M24 14v10l6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="hist__empty-title">История пуста</p>
      <p class="hist__empty-sub">После формирования документа закупки появятся здесь</p>
      <button class="hist__empty-btn" @click="router.push('/')">Начать поиск</button>
    </div>

    <!-- Список -->
    <div v-else class="hist__list">
      <div v-for="entry in cart.cartHistory" :key="entry.id" class="hist__entry">

        <!-- Строка-заголовок -->
        <button class="hist__entry-head" @click="toggle(entry.id)">
          <div class="hist__entry-left">
            <div class="hist__entry-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L10 1z" stroke="currentColor" stroke-width="1.3"/>
                <path d="M10 1v4h4M5 8h6M5 10.5h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="hist__entry-info">
              <span class="hist__entry-date">{{ formatDate(entry.date) }}</span>
              <span class="hist__entry-meta">{{ entry.count }} {{ pluralPos(entry.count) }}</span>
            </div>
          </div>
          <div class="hist__entry-right">
            <span class="hist__entry-total">{{ formatPrice(entry.total) }}</span>
            <svg
              class="hist__entry-chevron"
              :class="{ 'hist__entry-chevron--open': openId === entry.id }"
              width="14" height="14" viewBox="0 0 14 14" fill="none"
            >
              <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>

        <!-- Раскрытый список -->
        <div v-if="openId === entry.id" class="hist__entry-body">
          <table class="hist__table">
            <thead>
              <tr>
                <th class="hist__th hist__th--num">№</th>
                <th class="hist__th">Наименование</th>
                <th class="hist__th hist__th--num">Кол-во</th>
                <th class="hist__th hist__th--sm">Ед.</th>
                <th class="hist__th hist__th--price">Цена / ед.</th>
                <th class="hist__th hist__th--price">НМЦ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in entry.items" :key="item.id" class="hist__tr">
                <td class="hist__td hist__td--num hist__td--muted">{{ idx + 1 }}</td>
                <td class="hist__td hist__td--name">{{ item.customName }}</td>
                <td class="hist__td hist__td--num">{{ item.requestedQty }}</td>
                <td class="hist__td hist__td--sm">{{ item.requestedUnit }}</td>
                <td class="hist__td hist__td--price">{{ formatPrice(item.unitPrice) }}</td>
                <td class="hist__td hist__td--price hist__td--bold">{{ formatPrice(item.totalNmts) }}</td>
              </tr>
              <tr class="hist__tr hist__tr--total">
                <td class="hist__td" colspan="5">Итого НМЦ</td>
                <td class="hist__td hist__td--price hist__td--grand">{{ formatPrice(entry.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.hist {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

/* ── Навигация ── */
.hist__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-5);
}
.hist__back:hover { text-decoration: underline; }

/* ── Шапка ── */
.hist__header {
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
  margin-bottom: var(--space-5);
}

.hist__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.hist__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.2;
}

.hist__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  margin-top: 4px;
}

/* ── Пусто ── */
.hist__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: 80px var(--space-6);
  text-align: center;
}

.hist__empty-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--color-pale-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-main-blue);
}

.hist__empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.hist__empty-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.hist__empty-btn {
  margin-top: var(--space-2);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 8px 20px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.hist__empty-btn:hover { background: #dce8f5; border-color: var(--color-main-blue); }

/* ── Список ── */
.hist__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Запись ── */
.hist__entry {
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}
.hist__entry:hover { box-shadow: var(--shadow-sm); }

.hist__entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-4) var(--space-4);
  background: #fff;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}
.hist__entry-head:hover { background: var(--color-pale-blue); }

.hist__entry-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.hist__entry-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-base);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-main-blue);
  flex-shrink: 0;
}

.hist__entry-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hist__entry-date {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.hist__entry-meta {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.hist__entry-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.hist__entry-total {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
}

.hist__entry-chevron {
  color: var(--color-pale-black);
  transition: transform 200ms ease;
}
.hist__entry-chevron--open { transform: rotate(180deg); }

/* ── Раскрытое тело ── */
.hist__entry-body {
  border-top: 1px solid var(--color-gray-blue);
  overflow-x: auto;
  background: #fafbfd;
}

/* ── Таблица ── */
.hist__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.hist__th {
  text-align: left;
  padding: 8px 12px;
  background: var(--color-pale-blue);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-gray-blue);
}
.hist__th--num { text-align: center; width: 48px; }
.hist__th--sm  { width: 52px; }
.hist__th--price { text-align: right; }

.hist__td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-gray-blue);
  color: var(--color-black);
  vertical-align: middle;
  background: #fff;
}
.hist__tr:last-child .hist__td { border-bottom: none; }
.hist__td--num   { text-align: center; }
.hist__td--sm    { text-align: center; }
.hist__td--price { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.hist__td--bold  { font-weight: var(--font-weight-bold); }
.hist__td--muted { color: var(--color-pale-black); font-size: var(--font-size-xs); }
.hist__td--name  { font-weight: var(--font-weight-semibold); }
.hist__td--grand { font-weight: var(--font-weight-bold); color: var(--color-main-blue); }

.hist__tr--total .hist__td {
  background: var(--color-pale-blue);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
}
</style>
