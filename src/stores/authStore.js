import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuth   = ref(localStorage.getItem('isAuth') === 'true')
  const username = ref(localStorage.getItem('userName') || '')

  function login(name) {
    localStorage.setItem('isAuth', 'true')
    localStorage.setItem('userName', name)
    isAuth.value   = true
    username.value = name
  }

  function logout() {
    localStorage.removeItem('isAuth')
    localStorage.removeItem('userName')
    isAuth.value   = false
    username.value = ''
  }

  return { isAuth, username, login, logout }
})
