/**
 * Pinia-хранилище: глобальное состояние сервиса расчёта НМЦ
 * Workspace-архитектура: всё состояние хранится на бэке по workspace_id
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

  /* ─── Workspace ─── */
  const workspaceId = ref(null)

  /* ─── Геолокация (персистентность через localStorage) ─── */
  const userRegion      = ref(localStorage.getItem('userRegion')      || 'Москва')
  const detectedRegion  = ref(localStorage.getItem('detectedRegion')  || '')
  const regionDetecting = ref(false)
  const regionDetected  = ref(localStorage.getItem('regionDetected')  === 'true')
  const regionConfirmed = ref(localStorage.getItem('regionConfirmed') === 'true')

  /* ─── Данные закупок ─── */
  const procurements = ref([])

  /* ─── Данные НМЦК с бэка (null если данных нет) ─── */
  const nmckData = ref(null)

  /* ─── force_include / force_exclude ─── */
  const forceInclude = ref([])
  const forceExclude = ref([])

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

  /* ─── Вспомогательная функция: запрос с авто-обновлением токена ─── */
  async function withAuth(fn) {
    const auth = useAuthStore()
    try {
      return await fn(auth.accessToken)
    } catch (err) {
      if (err.status === 401) {
        const newToken = await auth.refresh()
        return await fn(newToken)
      }
      throw err
    }
  }

  /* ─── Преобразовать контракт из ответа API в объект procurement ─── */
  function contractToItem(c, i) {
    return {
      id:             c['Идентификатор контракта'] || `contract-${i}`,
      contractNumber: c['Идентификатор контракта'] || `contract-${i}`,
      steNumber:      c['Идентификатор СТЕ']       || '',
      name:           c['Наименование позиции СТЕ'] || c['Наименование закупки'] || '',
      unitPrice:      parseFloat(c['Цена за единицу']) || 0,
      quantity:       parseFloat(c['Количество'])      || 1,
      unit:           c['Единица измерения']           || requestedUnit.value || 'шт',
      totalPrice:     parseFloat(c['Стоимость контракта после заключения']) || 0,
      initialPrice:   parseFloat(c['Начальная стоимость контракта'])        || 0,
      reduction:      c['% снижения']   || '0',
      vatRate:        c['Ставка НДС']   || null,
      date:           c['Дата заключения контракта'] || '',
      region:         c['Регион заказчика']          || '',
      supplier:       c['ИНН поставщика']            || '—',
      customer:       c['ИНН заказчика']             || '—',
      supplierRegion: c['Регион поставщика']         || '',
      law:            c['Способ закупки']            || '44-ФЗ',
      isOutlier:      false,
      isExcluded:     false,
      manualPrice:    false,
      contractStatus: 'used',
      manualInclude:  false,
    }
  }

  /* ─── Применить результат nmck к procurements ─── */
  function applyNmck(result) {
    nmckData.value = result
    if (!result) return

    // Синхронизируем force_include / force_exclude из ответа бэка
    if (result.force_include) forceInclude.value = result.force_include
    if (result.force_exclude) forceExclude.value = result.force_exclude

    // contracts — единый список с полем status:
    // 'used' | 'outlier' | 'force_included' | 'force_excluded'
    const statusMap = new Map(
      (result.contracts || []).map(item => [
        item.contract['Идентификатор контракта'],
        item.status,
      ])
    )

    for (const p of procurements.value) {
      if (!p.id.startsWith('MAN-')) {
        const status = statusMap.get(p.contractNumber) || 'used'
        p.contractStatus  = status
        p.isOutlier       = status === 'outlier' || status === 'force_excluded'
        p.manualInclude   = status === 'force_included'
      }
    }
  }

  /* ─── Пересчитать НМЦК через workspace ─── */
  async function recalculate() {
    if (!workspaceId.value) return
    try {
      const data = await withAuth(token =>
        api.workspaceNmck(workspaceId.value, {
          force_include: forceInclude.value.length ? forceInclude.value : undefined,
          force_exclude: forceExclude.value.length ? forceExclude.value : undefined,
          quantity:      requestedQty.value  || 1,
          unit:          requestedUnit.value || 'шт',
        }, token)
      )
      applyNmck(data.nmck)
    } catch (_e) {
      // Ошибка пересчёта — оставляем текущие данные
    }
  }

  /**
   * Пересчитать НМЦК с передачей name/quantity/unit для генерации justification.
   * Возвращает nmck-объект с полем justification для добавления в корзину.
   */
  async function recalculateForCart(name, quantity, unit) {
    if (!workspaceId.value) return nmckData.value
    try {
      const data = await withAuth(token =>
        api.workspaceNmck(workspaceId.value, {
          force_include: forceInclude.value.length ? forceInclude.value : undefined,
          force_exclude: forceExclude.value.length ? forceExclude.value : undefined,
          name,
          quantity,
          unit,
        }, token)
      )
      applyNmck(data.nmck)
      return data.nmck
    } catch (_e) {
      return nmckData.value
    }
  }

  /**
   * Выполнить поиск: создаёт workspace на бэке и получает результаты.
   */
  async function search(query) {
    const trimmed = query?.trim()
    if (!trimmed) return

    steQuery.value    = trimmed
    isLoading.value   = true
    error.value       = null
    hasSearched.value = true
    forceInclude.value = []
    forceExclude.value = []
    workspaceId.value  = null

    try {
      const params = {
        query:     trimmed,
        region:    filters.value.region || userRegion.value || null,
        unit:      requestedUnit.value  || null,
        vat:       filters.value.vatRate   || null,
        date_from: filters.value.dateFrom  || null,
        date_to:   filters.value.dateTo    || null,
      }

      const data = await withAuth(token => api.workspaceSearch(params, token))

      workspaceId.value = data.workspace_id

      const contracts = data.contracts || []
      procurements.value = contracts.map((c, i) => contractToItem(c, i))

      if (data.nmck) {
        applyNmck(data.nmck)
        // Если justification ещё нет — запрашиваем nmck с quantity/unit чтобы сервер сгенерировал обоснование
        if (!data.nmck.justification && data.workspace_id) {
          try {
            const nmckResp = await withAuth(token =>
              api.workspaceNmck(data.workspace_id, {
                quantity: requestedQty.value || 1,
                unit:     requestedUnit.value || 'шт',
              }, token)
            )
            if (nmckResp?.nmck) applyNmck(nmckResp.nmck)
          } catch (_) { /* не критично */ }
        }
      } else {
        nmckData.value = null
      }

    } catch (err) {
      if (err.status === 401 || err.message === 'no_refresh_token') {
        error.value = 'Сессия истекла. Войдите снова.'
      } else {
        error.value = 'Не удалось загрузить данные. Попробуйте ещё раз.'
      }
      procurements.value = []
      nmckData.value     = null
      workspaceId.value  = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Восстановить состояние workspace по id (после перезагрузки страницы).
   */
  async function restoreWorkspace(id) {
    if (!id) return
    isLoading.value = true
    error.value     = null
    try {
      const data = await withAuth(token => api.workspaceGet(id, token))

      workspaceId.value = data.workspace_id || id
      hasSearched.value = true

      if (data.search?.query) steQuery.value = data.search.query

      const contracts = data.contracts || []
      procurements.value = contracts.map((c, i) => contractToItem(c, i))

      if (data.nmck) {
        applyNmck(data.nmck)
      } else {
        nmckData.value = null
      }
    } catch (err) {
      if (err.status === 404) {
        // Workspace истёк или не найден — нужен новый поиск
        error.value = 'Сессия поиска истекла. Выполните новый поиск.'
      } else {
        error.value = 'Не удалось восстановить сессию.'
      }
      workspaceId.value  = null
      procurements.value = []
      nmckData.value     = null
    } finally {
      isLoading.value = false
    }
  }

  /* ─── Универсальное действие по статусу контракта ─── */
  function contractAction(contractNumber) {
    const items = procurements.value.filter(p => p.id === contractNumber)
    if (items.length === 0) return
    const status = items[0].contractStatus || 'used'

    if (status === 'outlier') {
      if (!forceInclude.value.includes(contractNumber)) forceInclude.value.push(contractNumber)
      items.forEach(p => { p.contractStatus = 'force_included'; p.manualInclude = true; p.isOutlier = false })
    } else if (status === 'force_included') {
      const idx = forceInclude.value.indexOf(contractNumber)
      if (idx >= 0) forceInclude.value.splice(idx, 1)
      items.forEach(p => { p.contractStatus = 'outlier'; p.manualInclude = false; p.isOutlier = true })
    }
    recalculate()
  }

  /* ─── Исключить контракт из расчёта (force_exclude) ─── */
  function toggleExclude(id) {
    const idx = forceExclude.value.indexOf(id)
    if (idx >= 0) forceExclude.value.splice(idx, 1)
    else forceExclude.value.push(id)
    recalculate()
  }

  /* ─── Включить выброс в расчёт (force_include) ─── */
  function toggleManualInclude(id) {
    const idx = forceInclude.value.indexOf(id)
    if (idx >= 0) forceInclude.value.splice(idx, 1)
    else forceInclude.value.push(id)
    const p = procurements.value.find(p => p.id === id)
    if (p) p.manualInclude = idx < 0
    recalculate()
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
        localStorage.setItem('userRegion',     raw)
        localStorage.setItem('detectedRegion', raw)
      }
      regionDetected.value = true
      localStorage.setItem('regionDetected', 'true')
    } catch (_e) {
      // Геолокация отклонена или недоступна — оставляем Москва
    } finally {
      regionDetecting.value = false
    }
  }

  /* ─── Сбросить ручные изменения ─── */
  function resetManual() {
    forceInclude.value = []
    forceExclude.value = []
    procurements.value = procurements.value
      .filter(p => !p.id.startsWith('MAN-'))
      .map(p => ({ ...p, isExcluded: false, manualPrice: false, manualInclude: false, contractStatus: 'used', isOutlier: false }))
    recalculate()
  }

  /* ─── Увеличить версию документа ─── */
  function incrementVersion() {
    docVersion.value++
  }

  return {
    steQuery, isLoading, hasSearched, error,
    workspaceId,
    userRegion, detectedRegion, regionDetecting, regionDetected, regionConfirmed, detectRegion,
    procurements, nmckData,
    forceInclude, forceExclude,
    filters,
    requestedQty, requestedUnit,
    docVersion,
    availableRegions,
    withAuth,
    search, recalculate, recalculateForCart, restoreWorkspace,
    contractAction, toggleExclude, toggleManualInclude, setManualPrice, addManualEntry, resetManual,
    incrementVersion,
  }
})
