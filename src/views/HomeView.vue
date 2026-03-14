<script setup>
import { useRouter } from "vue-router";
import { usePriceStore } from "../stores/priceStore.js";
import SearchForm from "../components/search/SearchForm.vue";

const router = useRouter();
const store = usePriceStore();

async function handleSearch(query) {
  await store.search(query);
  router.push({ name: 'results', query: { q: query } });
}

const QUICK_EXAMPLES = [
  "Бумага офисная А4",
  "Ноутбук 15,6 дюймов",
  "Принтер лазерный",
  "Кресло офисное",
];

const STATS = [
  { value: "44-ФЗ", label: "Статья 22", note: "Метод СРЦ" },
  { value: "ЕИС", label: "Единая информ. система", note: "Актуальные данные" },
  { value: "IQR", label: "Автофильтрация", note: "Удаление выбросов" },
  {
    value: "МЭР № 567",
    label: "Приказ Минэкономразвития",
    note: "Документ к подписанию",
  },
];
</script>

<template>
  <div class="home">
    <!-- ===== Hero ===== -->
    <section class="home__hero">
      <div class="home__hero-bg" aria-hidden="true">
        <div class="home__hero-grid-lines" />
        <div class="home__hero-glow home__hero-glow--1" />
        <div class="home__hero-glow home__hero-glow--2" />
      </div>

      <div class="container home__hero-inner">
        <div class="home__hero-content">
          <!-- Заголовок -->
          <h1 class="home__hero-title">
            Обоснование<br />
            <span class="home__hero-title-accent">начальной максимальной</span
            ><br />
            цены контракта
          </h1>

          <p class="home__hero-subtitle">
            Введите наименование товара — система найдёт актуальные контракты
            из ЕИС, автоматически исключит выбросы по методу IQR и рассчитает
            НМЦК. Вы видите каждый контракт, его статус и можете управлять
            составом расчёта вручную.
          </p>

          <!-- Поиск -->
          <div class="home__search">
            <SearchForm :loading="store.isLoading" @search="handleSearch" />
          </div>

          <!-- Быстрые примеры -->
          <div class="home__examples">
            <span class="home__examples-label">Примеры запросов:</span>
            <div class="home__examples-list">
              <button
                v-for="ex in QUICK_EXAMPLES"
                :key="ex"
                class="home__example-btn"
                @click="handleSearch(ex)"
              >
                {{ ex }}
              </button>
            </div>
          </div>
        </div>

        <!-- Правая панель — превью документа -->
        <div class="home__hero-preview" aria-hidden="true">
          <div class="home__preview-card">
            <div class="home__preview-header">
              <span
                class="home__preview-header-dot home__preview-header-dot--red"
              />
              <span
                class="home__preview-header-dot home__preview-header-dot--yellow"
              />
              <span
                class="home__preview-header-dot home__preview-header-dot--green"
              />
              <span class="home__preview-header-title">Расчёт НМЦК</span>
            </div>
            <div class="home__preview-body">
              <div class="home__preview-row home__preview-row--label">
                Запрос
              </div>
              <div class="home__preview-row home__preview-row--query">
                Ноутбук 15,6 дюймов
              </div>
              <div class="home__preview-divider" />
              <div class="home__preview-stats">
                <div class="home__preview-stat">
                  <span class="home__preview-stat-val home__preview-stat-val--green">14</span>
                  <span class="home__preview-stat-label">всего</span>
                </div>
                <div class="home__preview-stat">
                  <span class="home__preview-stat-val home__preview-stat-val--green">12</span>
                  <span class="home__preview-stat-label">учтено</span>
                </div>
                <div class="home__preview-stat">
                  <span class="home__preview-stat-val home__preview-stat-val--orange">2</span>
                  <span class="home__preview-stat-label">выброса IQR</span>
                </div>
              </div>
              <div class="home__preview-divider" />
              <div class="home__preview-range">
                <div class="home__preview-range-bar">
                  <div class="home__preview-range-fill" />
                  <div class="home__preview-range-dot" style="left: 58%" />
                </div>
                <div class="home__preview-range-labels">
                  <span>42 000 ₽</span>
                  <span>Диапазон</span>
                  <span>89 500 ₽</span>
                </div>
              </div>
              <div class="home__preview-divider" />
              <div class="home__preview-nmc-label">НМЦ контракта</div>
              <div class="home__preview-nmc">824 760 <span>₽</span></div>
              <div class="home__preview-btn">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L8 1z"
                    stroke="currentColor"
                    stroke-width="1.3"
                  />
                  <path
                    d="M8 1v5h5"
                    stroke="currentColor"
                    stroke-width="1.3"
                    stroke-linecap="round"
                  />
                </svg>
                Сформировать документ
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Статусная полоса ===== -->
    <div class="home__stats-strip">
      <div class="container home__stats-inner">
        <div v-for="s in STATS" :key="s.value" class="home__stat">
          <span class="home__stat-value">{{ s.value }}</span>
          <div class="home__stat-text">
            <span class="home__stat-label">{{ s.label }}</span>
            <span class="home__stat-note">{{ s.note }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Шаги ===== -->
    <section class="home__how">
      <div class="container">
        <div class="home__how-head">
          <p class="home__how-eyebrow">Как это работает</p>
          <h2 class="home__how-title">Четыре шага к готовому обоснованию</h2>
        </div>

        <div class="home__steps">
          <div class="home__step">
            <div class="home__step-icon home__step-icon--blue">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.8"/>
                <path d="M14 14l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="home__step-num">01</div>
            <h3 class="home__step-title">Введите запрос</h3>
            <p class="home__step-desc">
              Укажите наименование товара, работы или услуги —
              система найдёт сопоставимые контракты в ЕИС
            </p>
          </div>

          <div class="home__step">
            <div class="home__step-icon home__step-icon--green">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 15l4-4 3 3 4-5 4 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="1" y="1" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.6"/>
              </svg>
            </div>
            <div class="home__step-num">02</div>
            <h3 class="home__step-title">Получите расчёт НМЦК</h3>
            <p class="home__step-desc">
              Автоматическое исключение выбросов по методу IQR,
              расчёт средневзвешенной цены, статус каждого контракта —
              <em>Учтено</em> или <em>Выброс IQR</em>
            </p>
          </div>

          <div class="home__step">
            <div class="home__step-icon home__step-icon--orange">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" stroke="currentColor" stroke-width="1.8"/>
                <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.6 5.6l1.4 1.4M14.6 14.6l1.4 1.4M5.6 16.4l1.4-1.4M14.6 7.4l1.4-1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="home__step-num">03</div>
            <h3 class="home__step-title">Управляйте выбросами</h3>
            <p class="home__step-desc">
              Изучите каждый контракт и его статус. Выброс IQR можно
              включить в расчёт — НМЦК пересчитается автоматически.
              Состав расчёта сохраняется в ссылке
            </p>
          </div>

          <div class="home__step">
            <div class="home__step-icon home__step-icon--sea">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M13 2H5a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M13 2v6h6M7 12h8M7 16h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="home__step-num">04</div>
            <h3 class="home__step-title">Сформируйте документ</h3>
            <p class="home__step-desc">
              Готовое обоснование НМЦК по Приказу МЭР № 567
              с расчётом, источниками и подписью
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
}

/* ===========================
   HERO
   =========================== */
.home__hero {
  position: relative;
  background: #0d1f3c;
  padding: 72px 0 80px;
}

/* Фоновые элементы */
.home__hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.home__hero-grid-lines {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.home__hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.home__hero-glow--1 {
  width: 500px;
  height: 500px;
  top: -150px;
  right: -100px;
  background: rgba(38, 75, 130, 0.45);
}

.home__hero-glow--2 {
  width: 380px;
  height: 380px;
  bottom: -120px;
  left: -60px;
  background: rgba(72, 184, 194, 0.2);
}

/* Внутренний лейаут */
.home__hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 60px;
  align-items: center;
}

.home__hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Бейдж */
.home__hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 14px;
  background: rgba(72, 184, 194, 0.15);
  border: 1px solid rgba(72, 184, 194, 0.35);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-sea-clear);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  width: fit-content;
}

.home__hero-badge-dot {
  width: 6px;
  height: 6px;
  background: var(--color-sea-clear);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.home__hero-badge-item {
  letter-spacing: 0.04em;
}

.home__hero-badge-item--dim {
  color: rgba(72, 184, 194, 0.65);
}

.home__hero-badge-sep {
  display: inline-block;
  width: 1px;
  height: 10px;
  background: rgba(72, 184, 194, 0.35);
  vertical-align: middle;
  margin: 0 2px;
}

/* Заголовок */
.home__hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-weight-bold);
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.home__hero-title-accent {
  color: var(--color-sea-clear);
}

/* Подзаголовок */
.home__hero-subtitle {
  max-width: 540px;
  font-size: var(--font-size-base);
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
}

/* Поиск */
.home__search {
  max-width: 640px;
}

/* Примеры */
.home__examples {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  max-width: 640px;
}

.home__examples-label {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.home__examples-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.home__example-btn {
  padding: 4px 12px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.home__example-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

/* Превью-карточка */
.home__hero-preview {
  display: flex;
  justify-content: center;
}

.home__preview-card {
  width: 100%;
  max-width: 340px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.home__preview-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.home__preview-header-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.home__preview-header-dot--red {
  background: #ff5f57;
}
.home__preview-header-dot--yellow {
  background: #ffbd2e;
}
.home__preview-header-dot--green {
  background: #28c840;
}

.home__preview-header-title {
  margin-left: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.home__preview-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.home__preview-row--label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.35);
}

.home__preview-row--query {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: #fff;
}

.home__preview-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.home__preview-stats {
  display: flex;
  gap: var(--space-4);
}

.home__preview-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.home__preview-stat-val {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.home__preview-stat-val--green {
  color: var(--color-sea-clear);
}
.home__preview-stat-val--orange {
  color: #f9c56a;
}
.home__preview-stat-val--gray {
  color: rgba(255, 255, 255, 0.35);
}

.home__preview-stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.home__preview-range-bar {
  position: relative;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-bottom: 6px;
}

.home__preview-range-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--color-main-blue),
    var(--color-sea-clear)
  );
  border-radius: 3px;
}

.home__preview-range-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  border: 2px solid var(--color-sea-clear);
}

.home__preview-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
}

.home__preview-nmc-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.35);
}

.home__preview-nmc {
  font-size: 1.75rem;
  font-weight: var(--font-weight-bold);
  color: #fff;
  line-height: 1;
}

.home__preview-nmc span {
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.5);
}

.home__preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--color-red);
  border-radius: var(--radius-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #fff;
  width: fit-content;
}

/* ===========================
   STATS STRIP
   =========================== */
.home__stats-strip {
  background: #fff;
  border-bottom: 1px solid var(--color-gray-blue);
  overflow-x: hidden;
}

.home__stats-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.home__stat {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5);
  border-right: 1px solid var(--color-gray-blue);
}

.home__stat:last-child {
  border-right: none;
}

.home__stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  white-space: nowrap;
  flex-shrink: 0;
}

.home__stat-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.home__stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  line-height: 1.3;
}

.home__stat-note {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

/* ===========================
   ШАГИ
   =========================== */
.home__how {
  padding: 80px 0;
  background: #fff;
  overflow-x: hidden;
}

.home__how-head {
  text-align: center;
  margin-bottom: var(--space-12);
}

.home__how-eyebrow {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-main-blue);
  margin-bottom: var(--space-2);
}

.home__how-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.2;
}

.home__steps {
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
}

.home__step {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-lg);
  background: #fff;
  position: relative;
  overflow: visible;
  transition: box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.home__step:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-main-blue);
}

.home__step::after {
  content: "→";
  position: absolute;
  right: calc(-1 * var(--space-4) / 2 - 7px);
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--color-gray-light);
  pointer-events: none;
  z-index: 2;
}

.home__step:last-child::after {
  display: none;
}

.home__step-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home__step-icon--blue {
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
}
.home__step-icon--green {
  background: #e6f5ee;
  color: var(--color-green);
}
.home__step-icon--orange {
  background: #fff0e4;
  color: var(--color-orange);
}
.home__step-icon--sea {
  background: #e4f4f5;
  color: var(--color-sea-dark);
}

.home__step-num {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.08em;
  color: var(--color-pale-black);
  text-transform: uppercase;
}

.home__step-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.3;
}

.home__step-desc {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  line-height: 1.6;
}

/* ===========================
   ПРАВОВАЯ БАЗА
   =========================== */
.home__legal {
  padding: 80px 0;
  background: #f5f8fc;
}

.home__legal-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.home__legal-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home__legal-eyebrow {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-main-blue);
}

.home__legal-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  line-height: 1.25;
}

.home__legal-desc {
  font-size: var(--font-size-base);
  color: var(--color-pale-black);
  line-height: 1.7;
}

.home__legal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.home__legal-tag {
  padding: 5px 12px;
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-gray-blue);
}

.home__legal-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.home__legal-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-fast);
}

.home__legal-card:hover {
  box-shadow: var(--shadow-base);
}

.home__legal-card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-base);
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home__legal-card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  margin-bottom: 3px;
}

.home__legal-card-desc {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  line-height: 1.5;
}

/* ===========================
   АДАПТИВ
   =========================== */
@media (max-width: 1100px) {
  .home__hero-inner {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }
  .home__hero-preview {
    display: none;
  }
  .home__legal-inner {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }
  .home__stats-inner {
    grid-template-columns: repeat(2, 1fr);
  }
  .home__stat:nth-child(2) {
    border-right: none;
  }
  .home__stat:nth-child(1),
  .home__stat:nth-child(2) {
    border-bottom: 1px solid var(--color-gray-blue);
  }
}

@media (max-width: 768px) {
  .home__hero {
    padding: 44px 0 48px;
  }
  .home__hero-title {
    font-size: clamp(1.5rem, 6vw, 2.2rem);
  }
  .home__hero-subtitle {
    font-size: var(--font-size-sm);
  }

  /* Статы: переключаем каждый в вертикальный вид */
  .home__stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: var(--space-3) var(--space-4);
  }
  .home__stat-value {
    font-size: var(--font-size-base);
  }
  .home__stat-note {
    display: none;
  }

  .home__steps {
    flex-direction: column;
    gap: var(--space-3);
  }
  .home__step {
    padding: var(--space-4);
  }
  .home__step::after {
    display: none;
  }
  .home__how,
  .home__legal {
    padding: 48px 0;
  }
  .home__how-title {
    font-size: var(--font-size-2xl);
  }
  .home__legal-title {
    font-size: var(--font-size-xl);
  }
  .home__how-head {
    margin-bottom: var(--space-8);
  }
}

@media (max-width: 540px) {
  .home__hero {
    padding: 32px 0 40px;
  }
  .home__hero-title {
    font-size: 1.5rem;
    line-height: 1.2;
  }
  .home__hero-subtitle {
    font-size: var(--font-size-sm);
  }
  .home__examples {
    flex-direction: column;
    align-items: flex-start;
  }

  /* Статы: 2 колонки, каждый стат — вертикально (значение над подписью) */
  .home__stats-inner {
    grid-template-columns: 1fr 1fr;
  }
  .home__stat {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-3) var(--space-3);
    gap: 2px;
  }
  .home__stat:nth-child(1),
  .home__stat:nth-child(3) {
    border-right: 1px solid var(--color-gray-blue);
  }
  .home__stat:nth-child(2),
  .home__stat:nth-child(4) {
    border-right: none;
  }
  .home__stat-value {
    font-size: var(--font-size-base);
    white-space: normal;
  }
  .home__stat-label {
    font-size: 11px;
  }
  .home__stat-note {
    display: none;
  }

  .home__how-title {
    font-size: var(--font-size-xl);
  }
  .home__legal-card {
    padding: var(--space-3) var(--space-4);
  }
  .home__legal-tags {
    gap: var(--space-1);
  }
  .home__legal-tag {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>
