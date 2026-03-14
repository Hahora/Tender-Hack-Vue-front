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

  /* ─── Геолокация ─── */
  const userRegion        = ref('Москва')   // активный регион (fallback если геолокация недоступна)
  const detectedRegion    = ref('')         // что нашла геолокация (до подтверждения)
  const regionDetecting   = ref(false)
  const regionDetected    = ref(false)
  const regionConfirmed   = ref(false)      // пользователь подтвердил/отклонил

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

  /* ─── Определить регион по геолокации ─── */
  async function detectRegion() {
    if (regionDetected.value || regionDetecting.value) return
    if (!navigator.geolocation) return
    regionDetecting.value = true
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      const { latitude: lat, longitude: lon } = pos.coords
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`,
        { headers: { 'Accept-Language': 'ru' } }
      )
      const data = await res.json()
      const raw  = data.address?.state || data.address?.city || data.address?.county || ''
      if (raw) {
        detectedRegion.value = raw
        userRegion.value     = raw   // сразу применяем — пользователь может откорректировать в баннере
      }
      regionDetected.value = true
    } catch {
      // Геолокация отклонена или недоступна — оставляем Московская область
    } finally {
      regionDetecting.value = false
    }
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
    userRegion, detectedRegion, regionDetecting, regionDetected, regionConfirmed, detectRegion,
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
