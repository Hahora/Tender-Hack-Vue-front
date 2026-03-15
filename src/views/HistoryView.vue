<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { formatPrice } from '../composables/usePriceCalculation.js'
import { api } from '../api/api.js'

const router     = useRouter()
const auth       = useAuthStore()
const openSearch = inject('openSearch')

const history    = ref([])
const isLoading  = ref(false)
const deletingId = ref(null)
const downloadingId = ref(null)

async function withAuth(fn) {
  try {
    return await fn(auth.accessToken)
  } catch (err) {
    if (err.status === 401) {
      const token = await auth.refresh()
      return await fn(token)
    }
    throw err
  }
}

async function loadHistory() {
  isLoading.value = true
  try {
    history.value = await withAuth(token => api.reportHistory(token))
  } catch {
    history.value = []
  } finally {
    isLoading.value = false
  }
}

async function redownload(entry) {
  if (downloadingId.value) return
  downloadingId.value = entry.id
  try {
    const result = await withAuth(token => api.reportHistoryGet(entry.id, token))
    const url = URL.createObjectURL(result.blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // ignore
  } finally {
    downloadingId.value = null
  }
}

async function deleteEntry(entry) {
  if (deletingId.value) return
  deletingId.value = entry.id
  try {
    await withAuth(token => api.reportHistoryDelete(entry.id, token))
    history.value = history.value.filter(e => e.id !== entry.id)
  } catch {
    // ignore
  } finally {
    deletingId.value = null
  }
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

onMounted(loadHistory)
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
        <p v-if="history.length" class="hist__subtitle">
          {{ history.length }} сформированных документов
        </p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="isLoading" class="hist__loading">
      <div class="hist__spinner" />
      <div>
        <p class="hist__loading-title">Загружаем историю…</p>
        <p class="hist__loading-sub">Получаем список документов</p>
      </div>
    </div>

    <!-- Пусто -->
    <div v-else-if="history.length === 0" class="hist__empty">
      <div class="hist__empty-icon">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2.2"/>
          <path d="M24 14v10l6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="hist__empty-title">История пуста</p>
      <p class="hist__empty-sub">После формирования документа закупки появятся здесь</p>
      <button class="hist__empty-btn" @click="openSearch()">Начать поиск</button>
    </div>

    <!-- Список -->
    <div v-else class="hist__list">
      <div
        v-for="entry in history" :key="entry.id"
        class="hist__entry"
        @click="router.push({ name: 'document', params: { id: entry.id } })"
        style="cursor:pointer"
      >

        <div class="hist__entry-left">
          <div class="hist__entry-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L10 1z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M10 1v4h4M5 8h6M5 10.5h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="hist__entry-info">
            <span class="hist__entry-date">{{ formatDate(entry.created_at) }}</span>
            <div class="hist__entry-meta-row">
              <span class="hist__entry-meta">{{ entry.item_count }} {{ pluralPos(entry.item_count) }}</span>
              <span class="hist__entry-source" :class="entry.source === 'cart' ? 'hist__entry-source--cart' : 'hist__entry-source--single'">
                {{ entry.source === 'cart' ? 'Из корзины' : 'Разовый' }}
              </span>
            </div>
          </div>
        </div>

        <div class="hist__entry-right">
          <span class="hist__entry-total">{{ formatPrice(entry.total_nmck) }}</span>
          <button
            class="hist__redown-btn"
            :disabled="downloadingId === entry.id"
            @click.stop="redownload(entry)"
            title="Скачать повторно"
          >
            <span v-if="downloadingId === entry.id" class="hist__btn-spinner" />
            <svg v-else width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 12h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            .docx
          </button>
          <button
            class="hist__del-btn"
            :disabled="deletingId === entry.id"
            @click.stop="deleteEntry(entry)"
            title="Удалить"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M11 3.5l-.7 8a.5.5 0 01-.5.5H4.2a.5.5 0 01-.5-.5L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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

/* ── Загрузка ── */
.hist__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
}

.hist__spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: hist-spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes hist-spin { to { transform: rotate(360deg); } }

.hist__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}
.hist__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-fast);
}
.hist__entry:hover { box-shadow: var(--shadow-sm); }

.hist__entry-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
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
  gap: 4px;
  min-width: 0;
}

.hist__entry-date {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.hist__entry-meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.hist__entry-meta {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.hist__entry-source {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  padding: 1px 7px;
  border-radius: var(--radius-full);
}
.hist__entry-source--cart   { color: var(--color-main-blue); background: var(--color-pale-blue); }
.hist__entry-source--single { color: #0d6b52; background: #e6f5ee; }

.hist__entry-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.hist__entry-total {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  margin-right: var(--space-2);
}

.hist__redown-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 5px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.hist__redown-btn:hover:not(:disabled) { background: #dce8f5; border-color: var(--color-main-blue); }
.hist__redown-btn:disabled { opacity: 0.6; cursor: default; }

.hist__del-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--color-pale-black);
  background: none;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}
.hist__del-btn:hover:not(:disabled) { color: var(--color-red); border-color: var(--color-red); background: #fff0f0; }
.hist__del-btn:disabled { opacity: 0.5; cursor: default; }

.hist__btn-spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 2px solid var(--color-gray-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: hist-spin 0.7s linear infinite;
}
</style>
