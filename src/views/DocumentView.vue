<script setup>
/**
 * Страница документа — предпросмотр и сохранение обоснования НМЦ.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePriceStore }       from '../stores/priceStore.js'
import { usePriceCalculation } from '../composables/usePriceCalculation.js'
import { useDocumentExport }   from '../composables/useDocumentExport.js'
import DocumentPreview from '../components/document/DocumentPreview.vue'
import AppButton       from '../components/ui/AppButton.vue'
import AppTag          from '../components/ui/AppTag.vue'
import { formatPrice }  from '../composables/usePriceCalculation.js'

const router = useRouter()
const store  = usePriceStore()

if (!store.hasSearched) {
  router.replace('/')
}

const {
  validProcurements,
  weightedAvgUnitPrice,
  totalNmts,
  statistics,
  justificationText,
} = usePriceCalculation(
  computed(() => store.procurements),
  computed(() => store.filters),
  computed(() => store.requestedQty),
)

const docExport = useDocumentExport()
const isSaving  = ref(false)

// Параметры для экспорта
const exportParams = computed(() => ({
  steQuery:           store.steQuery,
  requestedQty:       store.requestedQty,
  unit:               store.requestedUnit,
  justificationText:  justificationText.value,
  validProcurements:  validProcurements.value,
  totalNmts:          totalNmts.value,
}))

async function saveDoc() {
  isSaving.value = true
  // Небольшая задержка для UX
  await new Promise(r => setTimeout(r, 400))
  docExport.saveDocument(exportParams.value)
  store.incrementVersion()
  isSaving.value = false
}

async function recalcAndSave() {
  await store.search(store.steQuery)
  saveDoc()
}
</script>

<template>
  <div class="doc-view">
    <div class="container">

      <!-- Навигация -->
      <div class="doc-view__nav">
        <button class="doc-view__back" @click="router.back()">
          ← К результатам
        </button>
        <div class="doc-view__breadcrumb">
          <span>Главная</span>
          <span class="doc-view__sep">/</span>
          <span>Результаты</span>
          <span class="doc-view__sep">/</span>
          <span class="doc-view__breadcrumb-cur">Документ</span>
        </div>
      </div>

      <!-- Шапка страницы -->
      <div class="doc-view__header">
        <div>
          <h1 class="doc-view__title">Обоснование НМЦ</h1>
          <p class="doc-view__subtitle">{{ store.steQuery }}</p>
        </div>

        <!-- Итоговая цена крупно -->
        <div class="doc-view__nmts">
          <span class="doc-view__nmts-label">Итоговая НМЦ</span>
          <span class="doc-view__nmts-value">{{ formatPrice(totalNmts) }}</span>
          <AppTag color="blue">Версия {{ store.docVersion }}</AppTag>
        </div>
      </div>

      <!-- Сводка расчёта -->
      <div class="doc-view__summary-row">
        <div class="doc-view__summary-card">
          <span class="doc-view__summary-num">{{ statistics.count }}</span>
          <span class="doc-view__summary-desc">закупок учтено</span>
        </div>
        <div class="doc-view__summary-card doc-view__summary-card--warn">
          <span class="doc-view__summary-num">{{ statistics.outlierCount }}</span>
          <span class="doc-view__summary-desc">выбросов удалено</span>
        </div>
        <div class="doc-view__summary-card">
          <span class="doc-view__summary-num">{{ formatPrice(weightedAvgUnitPrice) }}</span>
          <span class="doc-view__summary-desc">цена / единица</span>
        </div>
        <div class="doc-view__summary-card doc-view__summary-card--accent">
          <span class="doc-view__summary-num">{{ store.requestedQty }} {{ store.requestedUnit }}</span>
          <span class="doc-view__summary-desc">запрошено</span>
        </div>
      </div>

      <!-- Панель уведомлений -->
      <div class="doc-view__notification doc-view__notification--success">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 9l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Все необходимые поля заполнены — документ готов к сохранению
        <div class="doc-view__notification-actions">
          <AppButton variant="ghost" size="sm" @click="router.back()">Отменить</AppButton>
          <AppButton variant="outline" size="sm" @click="recalcAndSave">Пересчитать и сохранить</AppButton>
          <AppButton variant="danger" size="sm" :loading="isSaving" @click="saveDoc">
            Опубликовать
          </AppButton>
        </div>
      </div>

      <!-- Двухколоночный лейаут -->
      <div class="doc-view__layout">

        <!-- Предпросмотр документа -->
        <div class="doc-view__preview-wrap">
          <DocumentPreview
            :text="justificationText"
            :ste-query="store.steQuery"
            :version="store.docVersion"
            :created-at="new Date().toISOString().split('T')[0]"
          />
        </div>

        <!-- Боковая панель: действия + статистика -->
        <aside class="doc-view__aside">

          <!-- Кнопки -->
          <div class="doc-view__actions-card">
            <h3 class="doc-view__actions-title">Действия с документом</h3>

            <AppButton
              variant="danger"
              size="md"
              block
              :loading="isSaving"
              @click="saveDoc"
            >
              <template #icon>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5l-3-3z" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M11 2v3H5V2M5 9h6M5 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </template>
              Сохранить (.txt)
            </AppButton>

            <AppButton
              variant="outline"
              size="md"
              block
              @click="recalcAndSave"
            >
              Пересчитать и сохранить
            </AppButton>

            <AppButton
              variant="ghost"
              size="md"
              block
              @click="router.back()"
            >
              ← Вернуться к редактированию
            </AppButton>
          </div>

          <!-- Используемые источники -->
          <div class="doc-view__sources-card">
            <h4 class="doc-view__sources-title">Источники ({{ validProcurements.length }})</h4>
            <div class="doc-view__sources-list">
              <div
                v-for="p in validProcurements.slice(0, 8)"
                :key="p.id"
                class="doc-view__source-item"
              >
                <span class="doc-view__source-id">{{ p.steNumber }}</span>
                <span class="doc-view__source-price">{{ formatPrice(p.unitPrice) }}</span>
              </div>
              <p v-if="validProcurements.length > 8" class="doc-view__sources-more">
                + ещё {{ validProcurements.length - 8 }} источников
              </p>
            </div>
          </div>

          <!-- Правовая основа -->
          <div class="doc-view__legal-card">
            <h4 class="doc-view__legal-title">Правовая основа</h4>
            <ul class="doc-view__legal-list">
              <li>44-ФЗ, ст. 22 — метод анализа рынка</li>
              <li>Приказ МЭР № 567 — порядок определения НМЦ</li>
              <li>Письмо Минфина № 24-01-10/15799</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-view {
  padding: var(--space-6) 0 var(--space-12);
  min-height: calc(100vh - 64px);
}

/* --- Навигация --- */
.doc-view__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.doc-view__back {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.doc-view__back:hover { text-decoration: underline; }

.doc-view__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.doc-view__sep { color: var(--color-gray-light); }

.doc-view__breadcrumb-cur {
  color: var(--color-black);
  font-weight: var(--font-weight-semibold);
}

/* --- Шапка --- */
.doc-view__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin-bottom: var(--space-5);
}

.doc-view__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: var(--space-1);
}

.doc-view__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-main-blue);
}

/* НМЦ крупно */
.doc-view__nmts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.doc-view__nmts-label {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.doc-view__nmts-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  line-height: 1;
}

/* --- Сводка --- */
.doc-view__summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.doc-view__summary-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.doc-view__summary-card--warn   { border-color: #f9c56a; background-color: #fffbf2; }
.doc-view__summary-card--accent { border-color: var(--color-main-blue); background-color: var(--color-pale-blue); }

.doc-view__summary-num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.doc-view__summary-desc {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* --- Уведомление --- */
.doc-view__notification {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.doc-view__notification--success {
  background-color: #e6f5ee;
  border: 1px solid #a8dfc0;
  color: #0a7d53;
}

.doc-view__notification-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

/* --- Двухколоночный лейаут --- */
.doc-view__layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-6);
  align-items: start;
}

.doc-view__preview-wrap {
  min-width: 0;
}

/* --- Боковая панель --- */
.doc-view__aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: sticky;
  top: 80px;
}

/* Карточка действий */
.doc-view__actions-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.doc-view__actions-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: var(--space-1);
}

/* Карточка источников */
.doc-view__sources-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.doc-view__sources-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: var(--space-3);
}

.doc-view__sources-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.doc-view__source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
}

.doc-view__source-id    { color: var(--color-pale-black); }
.doc-view__source-price { font-weight: var(--font-weight-semibold); color: var(--color-black); }

.doc-view__sources-more {
  font-size: var(--font-size-xs);
  color: var(--color-main-blue);
  text-align: center;
  margin-top: var(--space-2);
}

/* Правовая основа */
.doc-view__legal-card {
  background-color: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.doc-view__legal-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: var(--space-2);
}

.doc-view__legal-list {
  padding-left: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.doc-view__legal-list li {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  line-height: 1.5;
}

/* --- Адаптив --- */
@media (max-width: 1024px) {
  .doc-view__layout {
    grid-template-columns: 1fr;
  }

  .doc-view__aside {
    position: static;
    order: -1;
  }
}

@media (max-width: 640px) {
  .doc-view__summary-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .doc-view__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .doc-view__nmts {
    align-items: flex-start;
  }
}
</style>
