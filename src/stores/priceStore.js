/**
 * Pinia-хранилище: глобальное состояние сервиса расчёта НМЦ
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { REGIONS } from '../data/mockProcurements.js'
import { api } from '../api/api.js'
import { useAuthStore } from './authStore.js'

export const usePriceStore = defineStore('price', () => {

  /* ─── Состояние поиска ─── */
  const steQuery    = ref('')
  const isLoading   = ref(false)
  const hasSearched = ref(false)
  const error       = ref(null)

  /* ─── Геолокация ─── */
  const userRegion      = ref('Москва')
  const detectedRegion  = ref('')
  const regionDetecting = ref(false)
  const regionDetected  = ref(false)
  const regionConfirmed = ref(false)

  /* ─── Данные закупок (STЕ из API) ─── */
  const procurements = ref([])

  /* ─── Сырые данные НМЦК с бэка (null если данных нет) ─── */
  const nmckData = ref(null)

  /* ─── Фильтры ─── */
  const filters = ref({
    region:   '',
    dateFrom: '',
    dateTo:   '',
    vatRate:  '',
    outliers: 'all',
  })

  /* ─── Параметры расчёта ─── */
  const requestedQty  = ref(1)
  const requestedUnit = ref('шт')

  /* ─── Версия документа ─── */
  const docVersion = ref(1)

  /* ─── Регионы для фильтра ─── */
  const availableRegions = REGIONS

  /**
   * Выполнить поиск через бэк.
   * При 401 автоматически обновляет токен и повторяет запрос.
   */
  async function search(query) {
    const auth    = useAuthStore()
    const trimmed = query?.trim()
    if (!trimmed) return

    steQuery.value    = trimmed
    isLoading.value   = true
    error.value       = null
    hasSearched.value = true

    try {
      const params = {
        query:  trimmed,
        region: userRegion.value || null,
      }

      let data
      try {
        data = await api.search(params, auth.accessToken)
      } catch (err) {
        if (err.status === 401) {
          // Токен истёк — обновляем и повторяем
          const newToken = await auth.refresh()
          data = await api.search(params, newToken)
        } else {
          throw err
        }
      }

      nmckData.value = data.nmck || null

      procurements.value = (data.ste || []).map(item => ({
        id:          item.ste_id,
        steNumber:   item.ste_id,
        name:        item.name,
        category:    item.category || '',
        score:       item.score    ?? 0,
        unitPrice:   item.last_price ?? 0,
        unit:        requestedUnit.value,
        supplier:    '—',
        region:      userRegion.value,
        date:        new Date().toISOString().split('T')[0],
        law:         '44-ФЗ',
        isOutlier:   false,
        isExcluded:  false,
        manualPrice: false,
      }))

    } catch (err) {
      if (err.status === 401 || err.message === 'no_refresh_token') {
        error.value = 'Сессия истекла. Войдите снова.'
      } else {
        error.value = 'Не удалось загрузить данные. Попробуйте ещё раз.'
      }
      procurements.value = []
      nmckData.value     = null
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

  /* ─── Включить выброс в расчёт вручную ─── */
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
        userRegion.value     = raw
      }
      regionDetected.value = true
    } catch (_e) {
      // Геолокация отклонена или недоступна — оставляем Москва
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
    procurements, nmckData,
    filters,
    requestedQty, requestedUnit,
    docVersion,
    availableRegions,
    search,
    toggleExclude, toggleManualInclude, setManualPrice, addManualEntry, resetManual,
    incrementVersion,
  }
})
