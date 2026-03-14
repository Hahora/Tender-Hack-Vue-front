/**
 * Pinia-хранилище корзины закупок
 * Хранит позиции, добавленные из расчёта НМЦ
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items       = ref([])
  const cartHistory = ref([])   // архив завершённых корзин

  /**
   * Добавить или обновить позицию в корзине
   * Если позиция с таким steQuery уже есть — обновляем
   */
  function addItem({ steQuery, unitPrice, totalNmts, requestedQty, requestedUnit, justificationText, sourcesCount }) {
    const existing = items.value.find(i => i.steQuery === steQuery)
    if (existing) {
      existing.unitPrice        = unitPrice
      existing.totalNmts        = totalNmts
      existing.requestedQty     = requestedQty
      existing.requestedUnit    = requestedUnit
      existing.justificationText = justificationText
      existing.sourcesCount     = sourcesCount
      existing.updatedAt        = new Date().toISOString()
    } else {
      items.value.push({
        id:               `CART-${Date.now()}`,
        steQuery,
        customName:       steQuery,
        unitPrice,
        requestedQty,
        requestedUnit,
        totalNmts,
        justificationText,
        sourcesCount,
        addedAt:          new Date().toISOString(),
        updatedAt:        null,
      })
    }
  }

  function removeItem(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function updateItem(id, patch) {
    const item = items.value.find(i => i.id === id)
    if (item) Object.assign(item, patch)
  }

  /** Пересчитать НМЦ при изменении кол-ва */
  function updateQty(id, qty) {
    const item = items.value.find(i => i.id === id)
    if (item && qty > 0) {
      item.requestedQty = qty
      item.totalNmts    = item.unitPrice * qty
    }
  }

  /**
   * Архивировать текущую корзину → история, затем очистить
   * Вызывается при формировании документа
   */
  function archiveCart() {
    if (items.value.length === 0) return
    const total = items.value.reduce((s, i) => s + i.totalNmts, 0)
    cartHistory.value.unshift({
      id:        `HIST-${Date.now()}`,
      date:      new Date().toISOString(),
      items:     items.value.map(i => ({ ...i })),
      total,
      count:     items.value.length,
    })
    items.value = []
  }

  const grandTotal = computed(() =>
    items.value.reduce((s, i) => s + i.totalNmts, 0)
  )

  return { items, cartHistory, grandTotal, addItem, removeItem, updateItem, updateQty, archiveCart }
})
