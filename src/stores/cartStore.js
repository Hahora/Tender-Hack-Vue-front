/**
 * Pinia-хранилище корзины закупок
 * Позиции хранятся на бэке (POST/GET/PATCH/DELETE /api/v1/cart)
 * История — только локально
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/api.js'
import { useAuthStore } from './authStore.js'

export const useCartStore = defineStore('cart', () => {
  const items      = ref([])
  const isLoading  = ref(false)

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

  /** Загрузить корзину с сервера */
  async function load() {
    isLoading.value = true
    try {
      items.value = await withAuth(token => api.cartList(token))
    } catch (_e) {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Добавить позицию.
   * Если позиция с таким именем уже есть — обновляем через cart/{id}/nmck
   */
  async function addItem({ name, quantity, unit, unit_price, nmck_data }) {
    const existing = items.value.find(i => i.name === name)
    if (existing) {
      // Сначала обновляем quantity/unit через PATCH, затем NMCK через /nmck
      await withAuth(token =>
        api.cartPatch(existing.id, { quantity, unit }, token)
      )
      const updated = await withAuth(token =>
        api.cartUpdateNmck(existing.id, { unit_price, nmck_data }, token)
      )
      const idx = items.value.findIndex(i => i.id === existing.id)
      if (idx >= 0) items.value[idx] = { ...updated, quantity, unit }
      return updated
    }
    const item = await withAuth(token =>
      api.cartAdd({ name, quantity, unit, unit_price, nmck_data }, token)
    )
    items.value.unshift(item)
    return item
  }

  /** Удалить позицию */
  async function removeItem(id) {
    await withAuth(token => api.cartDelete(id, token))
    items.value = items.value.filter(i => i.id !== id)
  }

  /** Получить обоснование НМЦ позиции с сервера */
  async function fetchJustification(id) {
    return withAuth(token => api.cartJustification(id, token))
  }

  /** Обновить поля позиции (name, quantity, unit, unit_price) */
  async function patchItem(id, patch) {
    const updated = await withAuth(token => api.cartPatch(id, patch, token))
    const idx = items.value.findIndex(i => i.id === id)
    if (idx >= 0) items.value[idx] = updated
  }

  /** Изменить количество */
  async function updateQty(id, qty) {
    if (qty < 1) return
    await patchItem(id, { quantity: qty })
  }

  const grandTotal = computed(() =>
    items.value.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  )

  return {
    items, isLoading, grandTotal,
    load, addItem, removeItem, fetchJustification, patchItem, updateQty,
  }
})
