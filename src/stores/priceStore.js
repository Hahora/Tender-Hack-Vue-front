/**
 * Pinia-хранилище: глобальное состояние сервиса расчёта НМЦ
 * Объединяет данные поиска, фильтров и расчётов в одном месте
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateMockProcurements } from '../data/mockProcurements.js'
import { REGIONS } from '../data/mockProcurements.js'

export const usePriceStore = defineStore('price', () => {

  /* ─── Состояние поиска ─── */
  const steQuery    = ref('')      // название СТЕ
  const isLoading   = ref(false)
  const hasSearched = ref(false)
  const error       = ref(null)

  /* ─── Данные закупок ─── */
  const procurements = ref([])

  /* ─── Фильтры ─── */
  const filters = ref({
    region:   '',
    dateFrom: '',
    dateTo:   '',
    vatRate:  '',       // '' = все, '20'/'10'/'0'/'-1' (без НДС)
    outliers: 'all',   // 'all' | 'hide' | 'only'
  })

  /* ─── Параметры расчёта ─── */
  const requestedQty  = ref(1)
  const requestedUnit = ref('шт')

  /* ─── Версия документа ─── */
  const docVersion = ref(1)

  /* ─── Регионы для фильтра ─── */
  const availableRegions = REGIONS

  /* ─── Выполнить поиск ─── */
  async function search(query) {
    const trimmed = query?.trim()
    if (!trimmed) return
    steQuery.value    = trimmed
    isLoading.value   = true
    error.value       = null
    hasSearched.value = true
    try {
      // Имитация сетевого запроса; при подключении бэка заменить на fetch/axios
      await new Promise(r => setTimeout(r, 900 + Math.random() * 500))
      procurements.value = generateMockProcurements(trimmed, 30)
        .map(p => ({ ...p, isExcluded: false, manualPrice: false }))
    } catch {
      error.value = 'Не удалось загрузить данные. Попробуйте ещё раз.'
      procurements.value = []
    } finally {
      isLoading.value = false
    }
  }

  /* ─── Исключить/включить закупку ─── */
  function toggleExclude(id) {
    const p = procurements.value.find(p => p.id === id)
    if (p) p.isExcluded = !p.isExcluded
  }

  /* ─── Изменить цену вручную ─── */
  function setManualPrice(id, price) {
    const p = procurements.value.find(p => p.id === id)
    if (p && price > 0) {
      p.unitPrice   = price
      p.manualPrice = true
      p.isExcluded  = false
    }
  }

  /* ─── Добавить позицию вручную ─── */
  function addManualEntry({ unitPrice, quantity, supplier, region, date, unit }) {
    procurements.value.push({
      id:          `MAN-${Date.now()}`,
      steNumber:   'Ручной ввод',
      name:        steQuery.value,
      supplier:    supplier || '—',
      customer:    '—',
      region:      region   || '—',
      unitPrice,
      quantity:    quantity || 1,
      totalPrice:  unitPrice * (quantity || 1),
      unit:        unit     || requestedUnit.value,
      date:        date     || new Date().toISOString().split('T')[0],
      law:         '44-ФЗ',
      isOutlier:   false,
      isExcluded:  false,
      manualPrice: true,
    })
  }

  /* ─── Включить выброс в расчёт вручную (переопределяет IQR) ─── */
  function toggleManualInclude(id) {
    const p = procurements.value.find(p => p.id === id)
    if (p) p.manualInclude = !p.manualInclude
  }

  /* ─── Сбросить ручные изменения ─── */
  function resetManual() {
    procurements.value = procurements.value
      .filter(p => !p.id.startsWith('MAN-'))
      .map(p => ({ ...p, isExcluded: false, manualPrice: false }))
  }

  /* ─── Увеличить версию документа ─── */
  function incrementVersion() {
    docVersion.value++
  }

  return {
    steQuery, isLoading, hasSearched, error,
    procurements,
    filters,
    requestedQty, requestedUnit,
    docVersion,
    availableRegions,
    search,
    toggleExclude, toggleManualInclude, setManualPrice, addManualEntry, resetManual,
    incrementVersion,
  }
})
