<script setup>
import { ref } from 'vue'

defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const loginVal    = ref('')
const passwordVal = ref('')
const showPwd     = ref(false)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-box" role="dialog" aria-modal="true" aria-label="Вход">

          <!-- Табы -->
          <div class="modal-tabs">

            <!-- Таб 1: Логин и Пароль (активный) -->
            <button class="modal-tab modal-tab--active" type="button">
              <span class="modal-tab-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="10" height="10" rx="1" stroke="#264b82" stroke-width="1.8"/>
                  <rect x="15" y="3" width="10" height="10" rx="1" stroke="#264b82" stroke-width="1.8"/>
                  <rect x="3" y="15" width="10" height="10" rx="1" stroke="#264b82" stroke-width="1.8"/>
                  <rect x="15" y="15" width="10" height="10" rx="1" stroke="#264b82" stroke-width="1.8"/>
                </svg>
              </span>
              <span class="modal-tab-label">ЛОГИН<br>И ПАРОЛЬ</span>
            </button>

            <!-- Таб 2: Электронная подпись (заблокирован) -->
            <button class="modal-tab modal-tab--disabled" type="button" disabled>
              <span class="modal-tab-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="10" width="14" height="10" rx="2" stroke="#c0c0c0" stroke-width="1.6"/>
                  <path d="M8 10V7a4 4 0 018 0v3" stroke="#c0c0c0" stroke-width="1.6" stroke-linecap="round"/>
                  <path d="M18 12h6M18 16l3-1.5 3 1.5" stroke="#c0c0c0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="modal-tab-label">ЭЛЕКТРОННАЯ<br>ПОДПИСЬ</span>
            </button>

            <!-- Таб 3: МОС.РУ (заблокирован) -->
            <button class="modal-tab modal-tab--disabled" type="button" disabled>
              <span class="modal-tab-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="12" r="5" stroke="#c0c0c0" stroke-width="1.6"/>
                  <path d="M14 17v2M9 22c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#c0c0c0" stroke-width="1.6" stroke-linecap="round"/>
                  <path d="M20 8l4-4M22 4h3v3" stroke="#c0c0c0" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="modal-tab-label">МОС.РУ И ВНЕШНИЕ<br>СИСТЕМЫ</span>
            </button>
          </div>

          <!-- Линия под табами -->
          <div class="modal-tab-line">
            <div class="modal-tab-line-active" />
            <div class="modal-tab-line-inactive" />
            <div class="modal-tab-line-inactive" />
          </div>

          <!-- Тело формы -->
          <div class="modal-body">
            <h2 class="modal-title">Вход</h2>

            <div class="modal-field">
              <label class="modal-label">Логин</label>
              <input
                v-model="loginVal"
                type="text"
                placeholder="Введите логин"
                class="modal-input"
                autocomplete="username"
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Пароль</label>
              <div class="modal-input-wrap">
                <input
                  v-model="passwordVal"
                  :type="showPwd ? 'text' : 'password'"
                  placeholder="Введите пароль"
                  class="modal-input"
                  autocomplete="current-password"
                />
                <button
                  class="modal-eye"
                  type="button"
                  :aria-label="showPwd ? 'Скрыть пароль' : 'Показать пароль'"
                  @click="showPwd = !showPwd"
                >
                  <svg v-if="!showPwd" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 3l14 14M8.5 4.5A8 8 0 0110 4c5.5 0 9 6 9 6s-1.2 2.1-3 3.7M11.5 15.5A8 8 0 0110 16c-5.5 0-9-6-9-6s1.2-2.1 3-3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M7.5 10a2.5 2.5 0 014.8-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="modal-actions">
              <a href="#" class="modal-forgot">Забыли пароль?</a>
              <button class="modal-submit" type="button">Войти</button>
            </div>
          </div>

          <!-- Подвал -->
          <div class="modal-footer">
            <span>Нет аккаунта? <a href="#">Зарегистрируйтесь</a></span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Оверлей */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

/* Окно */
.modal-box {
  background: #fff;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
  position: relative;
}

/* ===== Табы ===== */
.modal-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-6) var(--space-6) 0;
  gap: var(--space-2);
}

.modal-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  text-align: center;
  border-radius: var(--radius-base) var(--radius-base) 0 0;
}

.modal-tab--active .modal-tab-label {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.modal-tab--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.modal-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-tab-label {
  font-family: var(--font-family);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: #999;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

/* Линия под табами */
.modal-tab-line {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0 var(--space-6);
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.modal-tab-line-active {
  height: 3px;
  background-color: var(--color-main-blue);
  border-radius: 2px;
}

.modal-tab-line-inactive {
  height: 3px;
  background-color: var(--color-gray-blue);
  border-radius: 2px;
}

/* ===== Тело формы ===== */
.modal-body {
  padding: 0 var(--space-8) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  text-align: center;
  margin-bottom: var(--space-2);
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.modal-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.modal-input {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  background-color: var(--color-pale-blue);
  border: 1.5px solid transparent;
  border-radius: var(--radius-base);
  padding: 10px 14px;
  outline: none;
  width: 100%;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.modal-input::placeholder {
  color: var(--color-pale-black);
}

.modal-input:focus {
  background-color: #fff;
  border-color: var(--color-main-blue);
}

.modal-input-wrap {
  position: relative;
}

.modal-input-wrap .modal-input {
  padding-right: 44px;
}

.modal-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-pale-black);
  display: flex;
  align-items: center;
  padding: 0;
  transition: color var(--transition-fast);
}

.modal-eye:hover {
  color: var(--color-main-blue);
}

/* Действия */
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.modal-forgot {
  font-size: var(--font-size-base);
  color: var(--color-main-blue);
  text-decoration: none;
}

.modal-forgot:hover {
  text-decoration: underline;
}

.modal-submit {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background-color: var(--color-red);
  border: none;
  cursor: pointer;
  padding: 10px 32px;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-fast);
}

.modal-submit:hover {
  background-color: #b82219;
}

/* ===== Подвал модалки ===== */
.modal-footer {
  background-color: var(--color-pale-blue);
  padding: var(--space-4) var(--space-8);
  text-align: center;
  font-size: var(--font-size-base);
  color: var(--color-pale-black);
}

.modal-footer a {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.modal-footer a:hover {
  text-decoration: underline;
}

/* ===== Анимация ===== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 220ms ease;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: transform 220ms ease, opacity 220ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: translateY(-20px);
  opacity: 0;
}

/* Закрыть по Esc */
@media (max-width: 540px) {
  .modal-body {
    padding: 0 var(--space-5) var(--space-6);
  }
  .modal-tabs {
    padding: var(--space-4) var(--space-4) 0;
  }
  .modal-tab-line {
    padding: 0 var(--space-4);
  }
}
</style>
