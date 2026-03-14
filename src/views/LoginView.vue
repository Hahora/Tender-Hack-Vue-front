<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'

const router = useRouter()
const auth   = useAuthStore()

const loginVal = ref('')
const pwdVal   = ref('')
const showPwd  = ref(false)
const error    = ref('')

async function submit() {
  error.value = ''
  try {
    await auth.login(loginVal.value, pwdVal.value)
    router.push({ name: 'home' })
  } catch (err) {
    if (err.status === 401) {
      error.value = 'Неверный логин или пароль'
    } else {
      error.value = 'Ошибка сервера. Попробуйте позже.'
    }
  }
}
</script>

<template>
  <div class="login-page">

    <!-- Декоративные круги -->
    <div class="login-page__bg" aria-hidden="true">
      <div class="login-page__bg-shape login-page__bg-shape--1" />
      <div class="login-page__bg-shape login-page__bg-shape--2" />
    </div>

    <div class="login-box">

      <!-- Табы -->
      <div class="ltabs">
        <button class="ltab ltab--active" type="button">
          <span class="ltab__icon">
            <!-- Логин/пароль: сетка ввода -->
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="6" width="24" height="16" rx="2.5" stroke="#264b82" stroke-width="1.7"/>
              <path d="M7 14h1.5M7 18h1.5M11.5 14h9M11.5 18h6" stroke="#264b82" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M7 10h14" stroke="#264b82" stroke-width="1.4" stroke-linecap="round" opacity=".4"/>
            </svg>
          </span>
          <span class="ltab__label">ЛОГИН<br>И ПАРОЛЬ</span>
        </button>

        <button class="ltab ltab--disabled" type="button" disabled>
          <span class="ltab__icon">
            <!-- Электронная подпись: щит с галочкой -->
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L4 7.5v7c0 5.5 4.3 9.8 10 11 5.7-1.2 10-5.5 10-11v-7L14 3z" stroke="#c0c0c0" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M9.5 14l3 3 6-5.5" stroke="#c0c0c0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="ltab__label">ЭЛЕКТРОННАЯ<br>ПОДПИСЬ</span>
        </button>

        <button class="ltab ltab--disabled" type="button" disabled>
          <span class="ltab__icon">
            <!-- МОС.РУ / внешние: глобус со стрелкой -->
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="13" cy="15" r="9" stroke="#c0c0c0" stroke-width="1.6"/>
              <path d="M13 6c-2.5 3-2.5 12 0 18M13 6c2.5 3 2.5 12 0 18M4 15h18" stroke="#c0c0c0" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M23 5l4-4M25 1h3v3" stroke="#c0c0c0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="ltab__label">МОС.РУ И<br>ВНЕШНИЕ СИСТЕМЫ</span>
        </button>
      </div>

      <!-- Линия под табами -->
      <div class="ltab-line">
        <div class="ltab-line__active" />
        <div class="ltab-line__inactive" />
        <div class="ltab-line__inactive" />
      </div>

      <!-- Форма -->
      <form class="lform" @submit.prevent="submit">
        <h1 class="lform__title">Вход</h1>

        <div class="lform__field">
          <label class="lform__label">Логин</label>
          <input
            v-model="loginVal"
            type="text"
            placeholder="Введите логин"
            class="lform__input"
            autocomplete="username"
          />
        </div>

        <div class="lform__field">
          <label class="lform__label">Пароль</label>
          <div class="lform__input-wrap">
            <input
              v-model="pwdVal"
              :type="showPwd ? 'text' : 'password'"
              placeholder="Введите пароль"
              class="lform__input"
              autocomplete="current-password"
            />
            <button
              class="lform__eye"
              type="button"
              @click="showPwd = !showPwd"
            >
              <svg v-if="!showPwd" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 3l14 14M8.5 4.5A8 8 0 0110 4c5.5 0 9 6 9 6s-1.2 2.1-3 3.7M11.5 15.5A8 8 0 0110 16c-5.5 0-9-6-9-6s1.2-2.1 3-3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Ошибка -->
        <div v-if="error" class="lform__error">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
            <path d="M7 4v4M7 9.5v.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          {{ error }}
        </div>

        <div class="lform__actions">
          <a href="#" class="lform__forgot">Забыли пароль?</a>
          <button class="lform__submit" type="submit">Войти</button>
        </div>
      </form>

      <!-- Футер -->
      <div class="lbox-footer">
        <span>Нет аккаунта? <a href="#">Зарегистрируйтесь</a></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  position: relative;
  background-color: #fff;
}

/* Декоративные круги */
.login-page__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.login-page__bg-shape {
  position: absolute;
  border-radius: 50%;
  background: var(--color-pale-blue);
  opacity: 0.65;
}

.login-page__bg-shape--1 {
  width: 520px;
  height: 520px;
  top: -180px;
  right: -130px;
}

.login-page__bg-shape--2 {
  width: 420px;
  height: 420px;
  bottom: -140px;
  left: -100px;
}

/* Карточка */
.login-box {
  position: relative;
  z-index: 1;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(38, 75, 130, 0.10);
}

/* ===== Табы ===== */
.ltabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-6) var(--space-6) 0;
  gap: var(--space-2);
}

.ltab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  background: none;
  border: none;
  text-align: center;
  border-radius: var(--radius-base) var(--radius-base) 0 0;
}

.ltab--active { cursor: pointer; }

.ltab--active .ltab__label {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.ltab--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ltab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ltab__label {
  font-family: var(--font-family);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: #aaa;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

/* Линия под табами */
.ltab-line {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0 var(--space-6);
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.ltab-line__active {
  height: 3px;
  background-color: var(--color-main-blue);
  border-radius: 2px;
}

.ltab-line__inactive {
  height: 3px;
  background-color: var(--color-gray-blue);
  border-radius: 2px;
}

/* ===== Форма ===== */
.lform {
  padding: 0 var(--space-8) var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.lform__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  text-align: center;
  margin-bottom: var(--space-2);
}

.lform__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lform__label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.lform__input {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  background-color: var(--color-pale-blue);
  border: 1.5px solid transparent;
  border-radius: var(--radius-base);
  padding: 11px 14px;
  outline: none;
  width: 100%;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.lform__input::placeholder { color: var(--color-pale-black); }

.lform__input:focus {
  background-color: #fff;
  border-color: var(--color-main-blue);
}

.lform__input-wrap { position: relative; }

.lform__input-wrap .lform__input { padding-right: 46px; }

.lform__eye {
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

.lform__eye:hover { color: var(--color-main-blue); }

/* Ошибка */
.lform__error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-red);
  background: #fdecea;
  border: 1px solid #f5beba;
  border-radius: var(--radius-base);
  padding: var(--space-2) var(--space-3);
}

.lform__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.lform__forgot {
  font-size: var(--font-size-base);
  color: var(--color-main-blue);
  text-decoration: none;
}

.lform__forgot:hover { text-decoration: underline; }

.lform__submit {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  background-color: var(--color-red);
  border: none;
  cursor: pointer;
  padding: 10px 36px;
  border-radius: var(--radius-base);
  transition: background-color var(--transition-fast);
}

.lform__submit:hover { background-color: #b82219; }

/* ===== Футер ===== */
.lbox-footer {
  background-color: var(--color-pale-blue);
  padding: var(--space-4) var(--space-8);
  text-align: center;
  font-size: var(--font-size-base);
  color: var(--color-pale-black);
}

.lbox-footer a {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.lbox-footer a:hover { text-decoration: underline; }

@media (max-width: 540px) {
  .login-page { padding: var(--space-4) var(--space-3); }
  .ltabs { padding: var(--space-4) var(--space-3) 0; gap: var(--space-1); }
  .ltab { padding: var(--space-2) var(--space-1); }
  .ltab__icon svg { width: 22px; height: 22px; }
  .ltab__label { font-size: 9px; }
  .ltab-line { padding: 0 var(--space-3); gap: var(--space-1); }
  .lform { padding: 0 var(--space-4) var(--space-5); gap: var(--space-4); }
  .lform__title { font-size: var(--font-size-xl); }
  .lform__actions { flex-direction: column-reverse; align-items: stretch; gap: var(--space-3); }
  .lform__submit { width: 100%; padding: 12px; }
  .lform__forgot { text-align: center; }
  .lbox-footer { padding: var(--space-4); }
}
</style>
