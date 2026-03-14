<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore.js'
import { usePriceStore } from '../stores/priceStore.js'
import { formatPrice } from '../composables/usePriceCalculation.js'

const router     = useRouter()
const cart       = useCartStore()
const store      = usePriceStore()
const openSearch = inject('openSearch')

const editingId   = ref(null)
const editingName = ref('')

function startEdit(item) {
  editingId.value   = item.id
  editingName.value = item.customName
}

function commitEdit(item) {
  if (editingName.value.trim()) {
    cart.updateItem(item.id, { customName: editingName.value.trim() })
  }
  editingId.value = null
}

async function recalculate(item) {
  await store.search(item.steQuery)
  router.push({ name: 'results' })
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function pluralPos(n) {
  if (n === 1) return 'позиция'
  if (n >= 2 && n <= 4) return 'позиции'
  return 'позиций'
}
</script>

<template>
  <div class="cart container">

    <!-- Навигация -->
    <div class="cart__nav">
      <button class="cart__back" @click="router.push('/')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        На главную
      </button>
      <button class="cart__hist-link" @click="router.push({ name: 'history' })">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.6"/>
          <path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        История закупок
      </button>
    </div>

    <!-- Шапка -->
    <div class="cart__header">
      <div class="cart__header-left">
        <p class="cart__eyebrow">Закупочная документация</p>
        <h1 class="cart__title">Корзина закупок</h1>
        <p v-if="cart.items.length" class="cart__subtitle">
          {{ cart.items.length }} {{ pluralPos(cart.items.length) }}
        </p>
      </div>
      <div v-if="cart.items.length" class="cart__header-right">
        <div class="cart__total-block">
          <span class="cart__total-label">Итого НМЦ</span>
          <span class="cart__total-val">{{ formatPrice(cart.grandTotal) }}</span>
        </div>
        <button class="cart__doc-btn" @click="router.push({ name: 'document' })">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L8 1z" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8 1v5h5M5 8h4M5 10.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Сформировать документ
        </button>
      </div>
    </div>

    <!-- Пустая корзина -->
    <div v-if="cart.items.length === 0" class="cart__empty">
      <div class="cart__empty-icon">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <path d="M6 9h6l6 24h24l4-16H14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="22" cy="40" r="3" stroke="currentColor" stroke-width="2.2"/>
          <circle cx="36" cy="40" r="3" stroke="currentColor" stroke-width="2.2"/>
        </svg>
      </div>
      <p class="cart__empty-title">Корзина пуста</p>
      <p class="cart__empty-sub">Добавляйте позиции из расчёта НМЦК</p>
      <button class="cart__empty-btn" @click="openSearch()">Начать поиск</button>
    </div>

    <!-- Список позиций -->
    <div v-else class="cart__list">
      <div v-for="item in cart.items" :key="item.id" class="cart__item">

        <!-- Шапка карточки -->
        <div class="cart__item-head">
          <div class="cart__item-name-wrap">
            <template v-if="editingId === item.id">
              <input
                class="cart__name-input"
                v-model="editingName"
                @keydown.enter="commitEdit(item)"
                @blur="commitEdit(item)"
                autofocus
              />
            </template>
            <template v-else>
              <button class="cart__item-name" @click="startEdit(item)">
                {{ item.customName }}
                <svg class="cart__edit-icon" width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                </svg>
              </button>
              <span v-if="item.customName !== item.steQuery" class="cart__item-ste">
                СТЕ: {{ item.steQuery }}
              </span>
            </template>
          </div>

          <div class="cart__item-head-right">
            <span class="cart__item-date">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ formatDate(item.updatedAt || item.addedAt) }}
            </span>
            <button class="cart__remove-btn" @click="cart.removeItem(item.id)" title="Удалить">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M11 3.5l-.7 8a.5.5 0 01-.5.5H4.2a.5.5 0 01-.5-.5L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Тело карточки -->
        <div class="cart__item-body">
          <!-- Кол-во -->
          <div class="cart__field">
            <span class="cart__field-label">Количество</span>
            <div class="cart__field-row">
              <input
                type="number" min="1"
                class="cart__qty-input"
                :value="item.requestedQty"
                @change="cart.updateQty(item.id, +$event.target.value)"
              />
              <input
                type="text"
                class="cart__unit-input"
                :value="item.requestedUnit"
                @change="cart.updateItem(item.id, { requestedUnit: $event.target.value })"
              />
            </div>
          </div>

          <!-- Источников -->
          <div class="cart__field">
            <span class="cart__field-label">Источников</span>
            <span class="cart__field-val">{{ item.sourcesCount }} контрактов</span>
          </div>

          <div class="cart__sep" />

          <!-- Цена / ед -->
          <div class="cart__field">
            <span class="cart__field-label">Цена / ед.</span>
            <span class="cart__field-val">{{ formatPrice(item.unitPrice) }}</span>
          </div>

          <!-- НМЦ -->
          <div class="cart__field cart__field--main">
            <span class="cart__field-label">НМЦ позиции</span>
            <span class="cart__field-price">{{ formatPrice(item.totalNmts) }}</span>
          </div>
        </div>

        <!-- Футер карточки -->
        <div class="cart__item-foot">
          <details class="cart__just">
            <summary class="cart__just-toggle">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <path d="M3.5 4h5M3.5 6.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              Обоснование НМЦ
            </summary>
            <p class="cart__just-text">{{ item.justificationText }}</p>
          </details>

          <button class="cart__recalc-btn" @click="recalculate(item)">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7a5 5 0 0 1 8.5-3.5L12 2M12 2v3H9M12 7a5 5 0 0 1-8.5 3.5L2 12M2 12V9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Пересчитать
          </button>
        </div>

      </div>
    </div>

    <!-- Нижний бар -->
    <div v-if="cart.items.length" class="cart__bar">
      <div class="cart__bar-info">
        <span class="cart__bar-count">{{ cart.items.length }} {{ pluralPos(cart.items.length) }}</span>
        <span class="cart__bar-total">Итого НМЦ: <strong>{{ formatPrice(cart.grandTotal) }}</strong></span>
      </div>
      <button class="cart__doc-btn cart__doc-btn--lg" @click="router.push({ name: 'document' })">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L8 1z" stroke="currentColor" stroke-width="1.3"/>
          <path d="M8 1v5h5M5 8h4M5 10.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        Сформировать документ
      </button>
    </div>

  </div>
</template>

<style scoped>
.cart {
  padding-top: var(--space-6);
  padding-bottom: 80px;
}

/* ── Навигация ── */
.cart__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.cart__back {
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
}
.cart__back:hover { text-decoration: underline; }

.cart__hist-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: none;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 4px 12px;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.cart__hist-link:hover { color: var(--color-main-blue); border-color: var(--color-main-blue); }

/* ── Шапка ── */
.cart__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.cart__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.cart__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.2;
}

.cart__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  margin-top: 4px;
}

.cart__header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.cart__total-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cart__total-label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.cart__total-val {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
}

/* ── Кнопка документа ── */
.cart__doc-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-main-blue);
  border: none;
  border-radius: var(--radius-base);
  padding: 8px 18px;
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
}
.cart__doc-btn:hover { background: #1a3a6e; }
.cart__doc-btn--lg { padding: 10px 24px; font-size: var(--font-size-base); }

/* ── Пустая корзина ── */
.cart__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: 80px var(--space-6);
  text-align: center;
}

.cart__empty-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--color-pale-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-main-blue);
}

.cart__empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.cart__empty-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.cart__empty-btn {
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
.cart__empty-btn:hover { background: #dce8f5; border-color: var(--color-main-blue); }

/* ── Список ── */
.cart__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Карточка ── */
.cart__item {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}
.cart__item:hover { box-shadow: var(--shadow-sm); }

/* Шапка карточки */
.cart__item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) 0;
}

.cart__item-name-wrap { flex: 1; min-width: 0; }

.cart__item-name {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  line-height: 1.4;
}
.cart__item-name:hover { color: var(--color-main-blue); }

.cart__edit-icon {
  color: var(--color-pale-black);
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}
.cart__item-name:hover .cart__edit-icon { opacity: 1; }

.cart__name-input {
  width: 100%;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  background: var(--color-pale-blue);
  border: 1.5px solid var(--color-main-blue);
  border-radius: var(--radius-base);
  padding: 4px 8px;
  outline: none;
}

.cart__item-ste {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  margin-top: 2px;
}

.cart__item-head-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.cart__item-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  white-space: nowrap;
}

.cart__remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--color-pale-black);
  background: none;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}
.cart__remove-btn:hover { color: var(--color-red); border-color: var(--color-red); background: #fff0f0; }

/* Тело карточки */
.cart__item-body {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-4);
  flex-wrap: wrap;
}

.cart__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cart__field-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-pale-black);
}

.cart__field-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.cart__field-price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
}

.cart__field-row {
  display: flex;
  gap: var(--space-1);
}

.cart__qty-input {
  width: 64px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 5px 8px;
  text-align: center;
  outline: none;
  transition: border-color var(--transition-fast);
}
.cart__qty-input:focus { border-color: var(--color-main-blue); }

.cart__unit-input {
  width: 56px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 5px 8px;
  outline: none;
  transition: border-color var(--transition-fast);
}
.cart__unit-input:focus { border-color: var(--color-main-blue); }

.cart__sep {
  width: 1px;
  height: 36px;
  background: var(--color-gray-blue);
  flex-shrink: 0;
}

/* Футер карточки */
.cart__item-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-gray-blue);
  background: #fafbfd;
  flex-wrap: wrap;
}

.cart__just { flex: 1; }

.cart__just-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.cart__just-toggle::-webkit-details-marker { display: none; }

.cart__just-text {
  margin-top: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  line-height: 1.6;
  white-space: pre-wrap;
  padding: var(--space-2) var(--space-3);
  background: var(--color-pale-blue);
  border-radius: var(--radius-base);
  border-left: 2px solid var(--color-main-blue);
}

.cart__recalc-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.cart__recalc-btn:hover { color: var(--color-main-blue); border-color: var(--color-main-blue); }

/* ── Нижний бар ── */
.cart__bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  background: #fff;
  border-top: 1px solid var(--color-gray-blue);
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  z-index: 100;
  flex-wrap: wrap;
}

.cart__bar-info {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
}

.cart__bar-count {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.cart__bar-total {
  font-size: var(--font-size-base);
  color: var(--color-black);
}

.cart__bar-total strong {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xl);
}
</style>
