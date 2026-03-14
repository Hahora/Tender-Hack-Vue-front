/**
 * Composable: поиск и загрузка цен по названию СТЕ
 *
 * Отвечает за имитацию запроса к ЕИС, управление состоянием загрузки
 * и хранение исходного списка закупок.
 */
import { ref, readonly } from 'vue'
import { generateMockProcurements } from '../data/mockProcurements.js'

export function usePriceSearch() {
  // Текущее название СТЕ
  const steQuery = ref('')

  // Список загруженных закупок
  const procurements = ref([])

  // Состояние загрузки
  const isLoading = ref(false)

  // Текст ошибки (если есть)
  const error = ref(null)

  // Флаг: был ли выполнен хотя бы один поиск
  const hasSearched = ref(false)

  /**
   * Выполняет поиск по названию СТЕ.
   * Имитирует задержку сетевого запроса.
   * @param {string} query - название СТЕ
   */
  async function search(query) {
    const trimmed = query?.trim()
    if (!trimmed) return

    steQuery.value    = trimmed
    isLoading.value   = true
    error.value       = null
    hasSearched.value = true

    try {
      // Имитируем задержку запроса к ЕИС (~1–2 сек)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600))

      const results = generateMockProcurements(trimmed, 30)
      // Сбрасываем ручные изменения при новом поиске
      procurements.value = results.map(p => ({ ...p, isExcluded: false }))
    } catch (err) {
      error.value = 'Не удалось загрузить данные из ЕИС. Попробуйте позже.'
      procurements.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Вручную исключает/включает закупку из расчёта
   * @param {string} id - идентификатор закупки
   */
  function toggleExclude(id) {
    const item = procurements.value.find(p => p.id === id)
    if (item) item.isExcluded = !item.isExcluded
  }

  /**
   * Устанавливает вручную введённую цену для закупки
   * @param {string} id    - идентификатор
   * @param {number} price - новая цена
   */
  function setManualPrice(id, price) {
    const item = procurements.value.find(p => p.id === id)
    if (item && !isNaN(price) && price > 0) {
      item.unitPrice   = price
      item.manualPrice = true  // помечаем как вручную изменённую
      item.isExcluded  = false // снимаем исключение
    }
  }

  /**
   * Добавляет новую закупку, введённую пользователем вручную
   * @param {Object} params - { unitPrice, quantity, supplier, region, date, unit }
   */
  function addManualEntry(params) {
    const id = `MAN-${Date.now()}`
    procurements.value.push({
      id,
      steNumber:   'Ручной ввод',
      name:        steQuery.value,
      supplier:    params.supplier || 'Не указан',
      customer:    '—',
      region:      params.region  || 'Не указан',
      unitPrice:   params.unitPrice,
      quantity:    params.quantity || 1,
      totalPrice:  params.unitPrice * (params.quantity || 1),
      unit:        params.unit    || 'шт',
      date:        params.date    || new Date().toISOString().split('T')[0],
      law:         '44-ФЗ',
      isOutlier:   false,
      isExcluded:  false,
      manualPrice: true,
    })
  }

  /**
   * Сбрасывает все ручные изменения (восстанавливает выбросы, снимает исключения)
   */
  function resetManualChanges() {
    procurements.value = procurements.value
      .filter(p => !p.manualPrice || p.id.startsWith('PRK-'))
      .map(p => ({ ...p, isExcluded: false, manualPrice: false }))
  }

  return {
    steQuery:     readonly(steQuery),
    procurements,
    isLoading:    readonly(isLoading),
    error:        readonly(error),
    hasSearched:  readonly(hasSearched),
    search,
    toggleExclude,
    setManualPrice,
    addManualEntry,
    resetManualChanges,
  }
}
