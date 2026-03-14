import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/api.js'

export const useAuthStore = defineStore('auth', () => {
  const accessToken  = ref(localStorage.getItem('access_token')  || '')
  const refreshToken = ref(localStorage.getItem('refresh_token') || '')
  const username     = ref(localStorage.getItem('userName')      || '')

  const isAuth = computed(() => !!accessToken.value)

  /** Вход: получаем пару токенов с бэка */
  async function login(user, password) {
    const data = await api.login(user, password)
    _setTokens(data)
    username.value = user
    localStorage.setItem('userName', user)
  }

  /** Выход: инвалидируем refresh-токен на сервере */
  async function logout() {
    try {
      if (accessToken.value && refreshToken.value) {
        await api.logout(accessToken.value, refreshToken.value)
      }
    } catch (_e) { /* игнорируем сетевые ошибки при выходе */ }
    _clearTokens()
  }

  /**
   * Обновляет access_token с помощью refresh_token.
   * Вызывается автоматически при 401 от сервера.
   */
  async function refresh() {
    if (!refreshToken.value) throw new Error('no_refresh_token')
    const data = await api.refresh(refreshToken.value)
    _setTokens(data)
    return data.access_token
  }

  function _setTokens({ access_token, refresh_token }) {
    accessToken.value  = access_token
    refreshToken.value = refresh_token
    localStorage.setItem('access_token',  access_token)
    localStorage.setItem('refresh_token', refresh_token)
  }

  function _clearTokens() {
    accessToken.value  = ''
    refreshToken.value = ''
    username.value     = ''
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('userName')
  }

  return { isAuth, username, accessToken, refreshToken, login, logout, refresh }
})
