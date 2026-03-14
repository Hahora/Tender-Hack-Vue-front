/**
 * Composable: расчёт начальной (максимальной) цены контракта (НМЦ)
 *
 * Реализует метод сопоставимых рыночных цен (анализ рынка) согласно 44-ФЗ.
 * Алгоритм:
 *   1. Фильтрация по региону (если задан)
 *   2. Удаление статистических выбросов методом IQR
 *   3. Расчёт средневзвешенной цены
 *   4. Формирование обоснования
 */
import { computed } from 'vue'

/**
 * Вычисляет квантили массива числовых значений
 * @param {number[]} sorted - отсортированный массив
 * @param {number}   q      - квантиль (0–1)
 */
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

/**
 * Метод IQR: находит границы допустимых цен
 * Выбросами считаются значения за пределами [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
 */
function getIqrBounds(prices) {
  if (!prices.length) return { lower: 0, upper: Infinity }
  const sorted = [...prices].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  return {
    lower: q1 - 1.5 * iqr,
    upper: q3 + 1.5 * iqr,
    q1,
    q3,
    iqr,
    median: quantile(sorted, 0.5),
  }
}

/**
 * Форматирует число в виде цены (руб.)
 */
export function formatPrice(value) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Форматирует дату в читаемый вид
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateStr))
}

/**
 * Основной composable расчёта НМЦ
 *
 * @param {Ref<Array>}  procurements  - реактивный список закупок
 * @param {Ref<Object>} filters       - реактивные фильтры { region, lawType, dateFrom, dateTo }
 * @param {Ref<number>} requestedQty  - запрашиваемое количество единиц
 */
export function usePriceCalculation(procurements, filters, requestedQty) {

  /**
   * Шаг 1: Применяем пользовательские фильтры (регион, закон, даты)
   */
  const filteredProcurements = computed(() => {
    const { region, dateFrom, dateTo, vatRate } = filters.value
    return procurements.value.filter(p => {
      if (region   && p.region !== region) return false
      if (dateFrom && p.date < dateFrom)   return false
      if (dateTo   && p.date > dateTo)     return false
      // '-1' означает «без НДС» (vatRate === null в данных)
      if (vatRate !== '' && vatRate !== undefined) {
        const v = vatRate === '-1' ? null : Number(vatRate)
        if (p.vatRate !== v) return false
      }
      return true
    })
  })

  /**
   * Шаг 2: Выявляем выбросы методом IQR и помечаем их
   * Возвращает закупки с проставленным флагом isOutlier
   */
  const processedProcurements = computed(() => {
    const prices = filteredProcurements.value.map(p => p.unitPrice)
    const bounds = getIqrBounds(prices)

    return filteredProcurements.value.map(p => ({
      ...p,
      isOutlier: p.unitPrice < bounds.lower || p.unitPrice > bounds.upper,
    }))
  })

  /**
   * Шаг 3: Допустимые закупки (без выбросов и без ручных исключений)
   */
  const validProcurements = computed(() =>
    processedProcurements.value.filter(p => (!p.isOutlier || p.manualInclude) && !p.isExcluded)
  )

  /**
   * Шаг 4: Средневзвешенная цена единицы товара
   * Взвешивание по объёму (количество × цена / сумма объёмов)
   */
  const weightedAvgUnitPrice = computed(() => {
    const items = validProcurements.value
    if (!items.length) return 0
    const totalVolume = items.reduce((sum, p) => sum + p.quantity, 0)
    const weightedSum  = items.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)
    return totalVolume > 0 ? weightedSum / totalVolume : 0
  })

  /**
   * Шаг 5: Итоговая НМЦ (цена × запрошенное количество)
   */
  const totalNmts = computed(() =>
    weightedAvgUnitPrice.value * (requestedQty.value || 1)
  )

  /**
   * Статистика выборки для отображения в обосновании
   */
  const statistics = computed(() => {
    const prices  = validProcurements.value.map(p => p.unitPrice)
    const bounds  = getIqrBounds(prices)
    const sorted  = [...prices].sort((a, b) => a - b)
    const outlierCount = processedProcurements.value.filter(p => p.isOutlier).length
    const excludedCount = procurements.value.filter(p => p.isExcluded).length

    return {
      count:         validProcurements.value.length,
      outlierCount,
      excludedCount,
      minPrice:      sorted[0] ?? 0,
      maxPrice:      sorted[sorted.length - 1] ?? 0,
      medianPrice:   bounds.median ?? 0,
      avgPrice:      prices.length ? prices.reduce((s, v) => s + v, 0) / prices.length : 0,
      q1:            bounds.q1 ?? 0,
      q3:            bounds.q3 ?? 0,
    }
  })

  /**
   * Генерирует текстовое обоснование расчёта НМЦ
   * Соответствует требованиям Приказа МЭР № 567
   */
  const justificationText = computed(() => {
    const stats = statistics.value
    const qty   = requestedQty.value || 1
    const f     = formatPrice

    if (!validProcurements.value.length) {
      return 'Недостаточно данных для формирования обоснования. Добавьте цены вручную.'
    }

    return `
Обоснование начальной (максимальной) цены контракта (НМЦ)

Метод определения НМЦ: метод сопоставимых рыночных цен (анализ рынка)
в соответствии с ч. 2 ст. 22 Федерального закона от 05.04.2013 № 44-ФЗ.

1. ИСХОДНЫЕ ДАННЫЕ
   Всего найдено закупок:        ${procurements.value.length} шт.
   После фильтрации по региону:  ${filteredProcurements.value.length} шт.
   Выбросы (метод IQR):          ${stats.outlierCount} шт. — исключены из расчёта
   Исключено пользователем:      ${stats.excludedCount} шт.
   Итого учтено в расчёте:       ${stats.count} шт.

2. СТАТИСТИКА ЦЕН (за единицу)
   Минимальная цена:             ${f(stats.minPrice)}
   Квартиль Q1 (25%):            ${f(stats.q1)}
   Медиана:                      ${f(stats.medianPrice)}
   Квартиль Q3 (75%):            ${f(stats.q3)}
   Максимальная цена:            ${f(stats.maxPrice)}
   Средняя (простая):            ${f(stats.avgPrice)}

3. РАСЧЁТ НМЦ
   Средневзвешенная цена ед.:    ${f(weightedAvgUnitPrice.value)}
   Требуемое количество:         ${qty} ед.
   НМЦ = ${f(weightedAvgUnitPrice.value)} × ${qty} = ${f(totalNmts.value)}

4. ВЫВОД
   Начальная (максимальная) цена контракта составляет ${f(totalNmts.value)}.
   Расчёт выполнен на основании ${stats.count} сопоставимых рыночных цен,
   полученных из ЕИС в сфере закупок.
    `.trim()
  })

  return {
    filteredProcurements,
    processedProcurements,
    validProcurements,
    weightedAvgUnitPrice,
    totalNmts,
    statistics,
    justificationText,
  }
}
