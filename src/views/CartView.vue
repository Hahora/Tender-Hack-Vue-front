<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore.js'
import { usePriceStore } from '../stores/priceStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { formatPrice } from '../composables/usePriceCalculation.js'
import { api } from '../api/api.js'

const router     = useRouter()
const cart       = useCartStore()
const store      = usePriceStore()
const auth       = useAuthStore()
const openSearch = inject('openSearch')

onMounted(() => cart.load())

const isDocGenerating = ref(false)

async function generateDocument() {
  if (isDocGenerating.value) return
  isDocGenerating.value = true
  try {
    let token = auth.accessToken
    let result
    try {
      result = await api.reportCart(token)
    } catch (err) {
      if (err.status === 401) {
        token = await auth.refresh()
        result = await api.reportCart(token)
      } else throw err
    }
    // Скачиваем файл
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
    // Перезагружаем корзину (сервер её очистил)
    await cart.load()
    // Получаем последнюю запись из истории для перехода
    const history = await api.reportHistory(token)
    const latest = history?.[0]
    if (latest?.id) {
      router.push({ name: 'document', params: { id: latest.id } })
    } else {
      router.push({ name: 'history' })
    }
  } catch (err) {
    console.error(err)
  } finally {
    isDocGenerating.value = false
  }
}

const editingId   = ref(null)
const editingName = ref('')
const openJust         = ref({})
const justTexts        = ref({})  // { [itemId]: string }
const justLoadingIds   = ref(new Set())
const recalcingId      = ref(null)

function startEdit(item) {
  editingId.value   = item.id
  editingName.value = item.name
}

async function commitEdit(item) {
  if (editingName.value.trim() && editingName.value.trim() !== item.name) {
    await cart.patchItem(item.id, { name: editingName.value.trim() })
  }
  editingId.value = null
}

async function recalculate(item) {
  recalcingId.value = item.id
  try {
    await store.search(item.name)
    router.push({ name: 'results', query: { q: item.name } })
  } finally {
    recalcingId.value = null
  }
}

function parseJustification(text) {
  if (!text?.trim()) return null
  const lines = text.split('\n')
  const preamble = []
  const sections = []
  let currentSection = null
  let inSections = false

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const secMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (secMatch) {
      inSections = true
      currentSection = { num: secMatch[1], title: secMatch[2].trim(), rows: [], paragraphs: [] }
      sections.push(currentSection)
    } else if (inSections && currentSection) {
      const t = line.trim()
      if (!t) continue
      const kvMatch = t.match(/^(.+?):\s{2,}(.+)$/)
      if (kvMatch) {
        currentSection.rows.push({ label: kvMatch[1].trim(), value: kvMatch[2].trim() })
      } else {
        currentSection.paragraphs.push(t)
      }
    } else {
      preamble.push(line.trim())
    }
  }
  return { preamble: preamble.filter(Boolean), sections }
}

async function toggleJust(id) {
  const nowOpen = !openJust.value[id]
  openJust.value = { ...openJust.value, [id]: nowOpen }
  if (nowOpen && justTexts.value[id] === undefined) {
    justLoadingIds.value = new Set([...justLoadingIds.value, id])
    try {
      const data = await cart.fetchJustification(id)
      justTexts.value = { ...justTexts.value, [id]: data?.justification || '' }
    } catch {
      justTexts.value = { ...justTexts.value, [id]: '' }
    } finally {
      const s = new Set(justLoadingIds.value)
      s.delete(id)
      justLoadingIds.value = s
    }
  }
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
        <button class="cart__doc-btn" :disabled="isDocGenerating" @click="generateDocument">
          <span v-if="isDocGenerating" class="cart__doc-spinner" />
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L8 1z" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8 1v5h5M5 8h4M5 10.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          {{ isDocGenerating ? 'Формируем…' : 'Сформировать документ' }}
        </button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="cart.isLoading" class="cart__loading">
      <div class="cart__spinner" />
      <div>
        <p class="cart__loading-title">Загружаем корзину…</p>
        <p class="cart__loading-sub">Получаем позиции закупки</p>
      </div>
    </div>

    <!-- Пустая корзина -->
    <div v-else-if="cart.items.length === 0" class="cart__empty">
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
    <div v-else-if="cart.items.length" class="cart__list">
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
                {{ item.name }}
                <svg class="cart__edit-icon" width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                </svg>
              </button>
            </template>
          </div>

          <div class="cart__item-head-right">
            <span class="cart__item-date">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              {{ formatDate(item.updated_at || item.created_at) }}
            </span>
            <button
              class="cart__recalc-btn"
              :class="{ 'cart__recalc-btn--loading': recalcingId === item.id }"
              :disabled="recalcingId === item.id"
              @click="recalculate(item)"
              title="Пересчитать НМЦК"
            >
              <span v-if="recalcingId === item.id" class="cart__recalc-spinner" />
              <svg v-else width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7a5 5 0 0 1 8.5-3.5L12 2M12 2v3H9M12 7a5 5 0 0 1-8.5 3.5L2 12M2 12V9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ recalcingId === item.id ? 'Загрузка…' : 'Пересчитать' }}
            </button>
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
                :value="item.quantity"
                @change="cart.updateQty(item.id, +$event.target.value)"
              />
              <span class="cart__unit-label">{{ item.unit }}</span>
            </div>
          </div>

          <!-- Источников -->
          <div class="cart__field">
            <span class="cart__field-label">Источников</span>
            <span class="cart__field-val">{{ item.nmck_data?.n_contracts ?? '—' }} контрактов</span>
          </div>

          <div class="cart__sep" />

          <!-- Цена / ед -->
          <div class="cart__field">
            <span class="cart__field-label">Цена / ед.</span>
            <span class="cart__field-val">{{ formatPrice(item.unit_price) }}</span>
          </div>

          <!-- НМЦ -->
          <div class="cart__field cart__field--main">
            <span class="cart__field-label">НМЦ позиции</span>
            <span class="cart__field-price">{{ formatPrice(item.unit_price * item.quantity) }}</span>
          </div>
        </div>

        <!-- Обоснование -->
        <div class="cart__just-section">
          <button class="cart__just-head" @click="toggleJust(item.id)">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 5h6M4 7.5h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span>Обоснование НМЦ</span>
            <span v-if="item.nmck_data?.n_contracts" class="cart__just-badge">
              {{ item.nmck_data.n_contracts }} контр.
            </span>
            <svg
              class="cart__just-chevron"
              :class="{ 'cart__just-chevron--open': openJust[item.id] }"
              width="10" height="10" viewBox="0 0 10 10" fill="none"
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <Transition name="just-slide">
            <div v-if="openJust[item.id]" class="cart__just-body">
              <p v-if="justLoadingIds.has(item.id)" class="cart__just-loading">Загрузка…</p>
              <div v-else-if="parseJustification(justTexts[item.id])" class="just">
                <div class="just__preamble">
                  <p v-for="(line, li) in parseJustification(justTexts[item.id]).preamble" :key="li"
                    :class="li === 0 ? 'just__title' : 'just__meta'">{{ line }}</p>
                </div>
                <div
                  v-for="sec in parseJustification(justTexts[item.id]).sections"
                  :key="sec.num"
                  class="just__section"
                >
                  <div class="just__section-head">
                    <span class="just__section-num">{{ sec.num }}</span>
                    <span class="just__section-title">{{ sec.title }}</span>
                  </div>
                  <table v-if="sec.rows.length" class="just__table">
                    <tr v-for="(row, ri) in sec.rows" :key="ri" class="just__row">
                      <td class="just__label">{{ row.label }}</td>
                      <td class="just__value">{{ row.value }}</td>
                    </tr>
                  </table>
                  <p v-for="(p, pi) in sec.paragraphs" :key="pi" class="just__paragraph">{{ p }}</p>
                </div>
              </div>
              <p v-else class="cart__just-loading">Обоснование не сформировано</p>
            </div>
          </Transition>
        </div>

      </div>
    </div>


  </div>
</template>

<style scoped>
.cart {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
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
.cart__doc-btn:hover:not(:disabled) { background: #1a3a6e; }
.cart__doc-btn:disabled { opacity: 0.7; cursor: default; }
.cart__doc-btn--lg { padding: 10px 24px; font-size: var(--font-size-base); }

.cart__doc-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: cart-spin 0.7s linear infinite;
}

/* ── Загрузка ── */
.cart__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
}

.cart__spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: cart-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes cart-spin {
  to { transform: rotate(360deg); }
}

.cart__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}

.cart__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

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

.cart__unit-label {
  display: flex;
  align-items: center;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  padding: 5px 4px;
}

.cart__sep {
  width: 1px;
  height: 36px;
  background: var(--color-gray-blue);
  flex-shrink: 0;
}

/* ── Кнопка пересчёта (в шапке карточки) ── */
.cart__recalc-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}
.cart__recalc-btn:hover:not(:disabled) { color: var(--color-main-blue); border-color: var(--color-main-blue); background: var(--color-pale-blue); }
.cart__recalc-btn--loading { opacity: 0.7; cursor: default; }
.cart__recalc-spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 2px solid var(--color-gray-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: cart-spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Обоснование ── */
.cart__just-section {
  border-top: 1px solid var(--color-gray-blue);
}

.cart__just-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px var(--space-4);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  text-align: left;
  transition: background var(--transition-fast);
}
.cart__just-head:hover { background: var(--color-pale-blue); }

.cart__just-badge {
  margin-left: 2px;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 1px 7px;
}

.cart__just-chevron {
  margin-left: auto;
  color: var(--color-pale-black);
  transition: transform 200ms ease;
  flex-shrink: 0;
}
.cart__just-chevron--open { transform: rotate(180deg); }

.cart__just-body {
  overflow: hidden;
  background: #fff;
  padding: var(--space-3) var(--space-4);
}

.cart__just-loading {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  font-style: italic;
  background: #fff;
}

/* ── Структурированное обоснование ── */
.just {
  background: #fff;
  padding: var(--space-3) var(--space-4) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.just__preamble {
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-gray-blue);
}

.just__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin: 0 0 4px;
  line-height: 1.4;
}

.just__meta {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  margin: 2px 0 0;
}

.just__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.just__section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.just__section-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-main-blue);
  color: #fff;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.just__section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.just__table {
  width: 100%;
  border-collapse: collapse;
}

.just__row:not(:last-child) .just__label,
.just__row:not(:last-child) .just__value {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.just__label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 3px 8px 3px 0;
  width: 60%;
  vertical-align: top;
}

.just__value {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  text-align: right;
  padding: 3px 0;
  white-space: nowrap;
  vertical-align: top;
}

.just__paragraph {
  font-size: var(--font-size-xs);
  color: var(--color-black);
  line-height: 1.6;
  margin: 0;
  padding: var(--space-2) var(--space-3);
  background: #fff;
  border-radius: var(--radius-base);
  border-left: 3px solid var(--color-main-blue);
}

.just-slide-enter-active,
.just-slide-leave-active {
  transition: max-height 220ms ease, opacity 180ms ease;
  max-height: 400px;
  overflow: hidden;
}
.just-slide-enter-from,
.just-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
