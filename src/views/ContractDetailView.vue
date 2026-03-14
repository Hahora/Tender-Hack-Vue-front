<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePriceStore } from '../stores/priceStore.js'
import { api } from '../api/api.js'
import { formatPrice, formatDate } from '../composables/usePriceCalculation.js'

const route  = useRoute()
const router = useRouter()
const store  = usePriceStore()

const contractNumber = route.params.number
const steId          = route.query.steId

const isLoading = ref(false)
const apiFetched = ref([]) // procurements fetched from API

// Из стора
const storeItems = computed(() =>
  store.procurements.filter(p => p.contractNumber === contractNumber)
)

// Итоговый список: стор приоритетнее
const procurements = computed(() =>
  storeItems.value.length ? storeItems.value : apiFetched.value
)

const first = computed(() => procurements.value[0] || null)

function mapContract(c, i) {
  return {
    id:             c['Идентификатор контракта'] || `contract-${i}`,
    contractNumber: c['Идентификатор контракта'] || `contract-${i}`,
    steNumber:      c['Идентификатор СТЕ']       || '',
    name:           c['Наименование позиции СТЕ'] || c['Наименование закупки'] || '',
    unitPrice:      parseFloat(c['Цена за единицу']) || 0,
    quantity:       parseFloat(c['Количество'])      || 1,
    unit:           c['Единица измерения']           || 'шт',
    totalPrice:     parseFloat(c['Стоимость контракта после заключения']) || 0,
    vatRate:        c['Ставка НДС']   ?? null,
    date:           c['Дата заключения контракта'] || '',
    region:         c['Регион заказчика']          || '',
    supplierRegion: c['Регион поставщика']         || '',
    supplier:       c['ИНН поставщика']            || '—',
    customer:       c['ИНН заказчика']             || '—',
  }
}

onMounted(async () => {
  if (storeItems.value.length || !steId) return
  isLoading.value = true
  try {
    const data = await store.withAuth(token => api.contracts(steId, token))
    const contracts = data.contracts || []
    apiFetched.value = contracts
      .filter(c => c['Идентификатор контракта'] === contractNumber)
      .map(mapContract)
    // Если нет совпадений по contractNumber — показать все контракты СТЕ
    if (!apiFetched.value.length) {
      apiFetched.value = contracts.map(mapContract)
    }
  } catch (_e) {
    // Не удалось загрузить — оставляем пустым
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="cd container">

    <!-- Назад -->
    <button class="cd__back" @click="router.back()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Назад
    </button>

    <div v-if="isLoading" class="cd__empty">Загрузка...</div>
    <div v-else-if="!first" class="cd__empty">Контракт не найден</div>

    <template v-else-if="first">

      <!-- Заголовок -->
      <div class="cd__header">
        <div>
          <p class="cd__eyebrow">Реестровый номер контракта</p>
          <h1 class="cd__title">{{ contractNumber }}</h1>
        </div>
      </div>

      <!-- Мета: поставщик, заказчик, регион, дата -->
      <div class="cd__meta-row">
        <div class="cd__meta-item">
          <span class="cd__meta-label">Поставщик</span>
          <span class="cd__meta-val">{{ first.supplier }}</span>
        </div>
        <div class="cd__meta-item">
          <span class="cd__meta-label">Заказчик</span>
          <span class="cd__meta-val">{{ first.customer }}</span>
        </div>
        <div class="cd__meta-item">
          <span class="cd__meta-label">Регион поставщика</span>
          <span class="cd__meta-val">{{ first.supplierRegion || first.region }}</span>
        </div>
        <div class="cd__meta-item">
          <span class="cd__meta-label">Дата</span>
          <span class="cd__meta-val">{{ formatDate(first.date) }}</span>
        </div>
        <div class="cd__meta-item">
          <span class="cd__meta-label">НДС</span>
          <span class="cd__meta-val">{{ first.vatRate != null ? `${first.vatRate}%` : 'Без НДС' }}</span>
        </div>
      </div>

      <!-- Карточки позиций -->
      <div class="cd__cards">
        <div v-for="p in procurements" :key="p.id" class="cd__card">

          <!-- Название -->
          <div class="cd__card-name">{{ p.name }}</div>

          <!-- Поля в 2 ряда -->
          <div class="cd__card-fields">
            <div class="cd__field">
              <span class="cd__field-label">Регион поставщика</span>
              <span class="cd__field-val">{{ p.supplierRegion || p.region }}</span>
            </div>
            <div class="cd__field">
              <span class="cd__field-label">Дата</span>
              <span class="cd__field-val">{{ formatDate(p.date) }}</span>
            </div>
            <div class="cd__field">
              <span class="cd__field-label">Количество</span>
              <span class="cd__field-val">{{ p.quantity }}&nbsp;{{ p.unit }}</span>
            </div>
            <div class="cd__field">
              <span class="cd__field-label">НДС</span>
              <span class="cd__field-val">{{ p.vatRate != null ? `${p.vatRate}%` : 'Без НДС' }}</span>
            </div>
            <div class="cd__field">
              <span class="cd__field-label">Сумма</span>
              <span class="cd__field-val cd__field-val--total">{{ formatPrice(p.totalPrice) }}</span>
            </div>
            <div class="cd__field">
              <span class="cd__field-label">Цена за ед.</span>
              <span class="cd__field-val cd__field-val--unit">{{ formatPrice(p.unitPrice) }}&nbsp;/&nbsp;{{ p.unit }}</span>
            </div>
          </div>

        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.cd {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.cd__back {
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

.cd__back:hover { text-decoration: underline; }

/* Заголовок */
.cd__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cd__eyebrow {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.cd__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  font-family: monospace;
  letter-spacing: 0.04em;
  word-break: break-all;
}

.cd__eis-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 7px 14px;
  text-decoration: none;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.cd__eis-link:hover { background: #dce8f5; }

/* Мета-строка */
.cd__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  overflow: hidden;
}

.cd__meta-item {
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-4) var(--space-5);
  border-right: 1px solid var(--color-gray-blue);
}

.cd__meta-item:last-child { border-right: none; }

.cd__meta-label {
  font-size: 11px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cd__meta-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

/* Карточки позиций */
.cd__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cd__card {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cd__card-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.cd__card-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
}

.cd__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
}

.cd__field-label {
  font-size: 11px;
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cd__field-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.cd__field-val--total {
  color: var(--color-main-blue);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
}

.cd__field-val--unit {
  color: var(--color-green);
  font-weight: var(--font-weight-bold);
}

.cd__empty {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-pale-black);
  font-size: var(--font-size-md);
}
</style>
