<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { api } from '../api/api.js'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const isLoading    = ref(true)
const isDownloading = ref(false)
const error        = ref('')
const docContainer = ref(null)
const entryId      = route.params.id

async function withAuth(fn) {
  try {
    return await fn(auth.accessToken)
  } catch (err) {
    if (err.status === 401) {
      const token = await auth.refresh()
      return await fn(token)
    }
    throw err
  }
}

onMounted(async () => {
  if (!entryId) {
    router.replace({ name: 'history' })
    return
  }
  try {
    const result = await withAuth(token => api.reportHistoryGet(entryId, token))
    const { renderAsync } = await import('docx-preview')
    await renderAsync(result.blob, docContainer.value, null, {
      className: 'docx-render',
      inWrapper: false,
      ignoreWidth: true,
      ignoreHeight: true,
      ignoreFonts: false,
      breakPages: true,
      useBase64URL: true,
    })
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить документ'
  } finally {
    isLoading.value = false
  }
})

async function download() {
  if (isDownloading.value) return
  isDownloading.value = true
  try {
    const result = await withAuth(token => api.reportHistoryGet(entryId, token))
    const url = URL.createObjectURL(result.blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="dv">
    <div class="container">

      <!-- Навигация -->
      <div class="dv__nav">
        <button class="dv__back" @click="router.push({ name: 'history' })">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          В историю
        </button>
        <button class="dv__download-btn" :disabled="isLoading || isDownloading" @click="download">
          <span v-if="isDownloading" class="dv__spinner" />
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ isDownloading ? 'Скачиваем…' : 'Скачать .docx' }}
        </button>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="dv__loading">
        <div class="dv__loading-spinner" />
        <div>
          <p class="dv__loading-title">Загружаем документ…</p>
          <p class="dv__loading-sub">Получаем файл с сервера</p>
        </div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="dv__error">
        <p>{{ error }}</p>
        <button class="dv__back" @click="router.push({ name: 'history' })">Вернуться в историю</button>
      </div>

      <!-- Документ -->
      <div class="dv__doc-wrap">
        <div ref="docContainer" class="dv__doc-content" />
      </div>

    </div>
  </div>
</template>

<style scoped>
.dv {
  background: #f5f8fc;
  min-height: 100vh;
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.dv__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.dv__back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.dv__back:hover { text-decoration: underline; }

.dv__download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background: var(--color-main-blue);
  border: none;
  border-radius: var(--radius-base);
  padding: 8px 18px;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.dv__download-btn:hover:not(:disabled) { background: #1a3a6e; }
.dv__download-btn:disabled { opacity: 0.65; cursor: default; }

.dv__spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: dv-spin 0.7s linear infinite;
}
@keyframes dv-spin { to { transform: rotate(360deg); } }

/* Загрузка */
.dv__loading {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
}
.dv__loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--color-pale-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: dv-spin 0.8s linear infinite;
  flex-shrink: 0;
}
.dv__loading-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}
.dv__loading-sub {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

/* Ошибка */
.dv__error {
  padding: var(--space-4);
  background: #fdecea;
  border: 1px solid #f5b7b1;
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  color: #a03030;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

/* Обёртка документа */
.dv__doc-wrap {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  overflow: hidden;
  max-width: 900px;
  margin: 0 auto;
}

.dv__doc-content {
  padding: 48px 56px;
}
</style>

<style>
/* Глобальные стили для docx-preview (не scoped) */
.docx-render section.docx {
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: unset !important;
}
.docx-render p {
  margin: 0.3em 0;
}
</style>
