<script setup>
import { ref, computed } from 'vue'
import AppButton from '../ui/AppButton.vue'
import { formatPrice } from '../../composables/usePriceCalculation.js'

const props = defineProps({
  unitPrice:         { type: Number, default: 0 },
  totalNmts:         { type: Number, default: 0 },
  statistics:        { type: Object, required: true },
  requestedQty:      { type: Number, default: 1 },
  unit:              { type: String, default: 'шт' },
  justificationText: { type: String, default: '' },
  docVersion:        { type: Number, default: 1 },
  isRecalculating:   { type: Boolean, default: false },
})

const emit = defineEmits(['go-document', 'recalculate'])

const showJustification = ref(false)

const hasEnoughData = computed(() => props.statistics.count >= 3)

// Позиция медианы на шкале мин–макс
const medianPosition = computed(() => {
  const { minPrice, maxPrice, medianPrice } = props.statistics
  if (!maxPrice || maxPrice === minPrice) return 50
  return Math.round(((medianPrice - minPrice) / (maxPrice - minPrice)) * 100)
})
</script>

<template>
  <div class="cs">

    <!-- Заголовок -->
    <div class="cs__header">
      <div class="cs__header-left">
        <h3 class="cs__title">Расчёт НМЦ</h3>
        <span class="cs__method">Метод сопоставимых рыночных цен</span>
      </div>
      <div class="cs__header-right">
<span :class="['cs__status-badge', hasEnoughData ? 'cs__status-badge--ok' : 'cs__status-badge--warn']">
          {{ hasEnoughData ? 'Достаточно данных' : 'Мало данных' }}
        </span>
      </div>
    </div>

    <!-- Источники — одна строка с чипами -->
    <div class="cs__sources">
      <span class="cs__chip">
        Всего&nbsp;<strong>{{ statistics.count + statistics.outlierCount + statistics.excludedCount }}</strong>
      </span>
      <span class="cs__chip cs__chip--green">
        <span class="cs__dot cs__dot--green" />
        Учтено&nbsp;<strong>{{ statistics.count }}</strong>
      </span>
      <span class="cs__chip cs__chip--orange">
        <span class="cs__dot cs__dot--orange" />
        Выброс&nbsp;<strong>{{ statistics.outlierCount }}</strong>
      </span>
<span v-if="statistics.excludedCount" class="cs__chip cs__chip--gray">
        <span class="cs__dot cs__dot--gray" />
        Вручную&nbsp;<strong>{{ statistics.excludedCount }}</strong>
      </span>
    </div>

    <!-- Ценовой диапазон -->
    <div class="cs__range">
      <div class="cs__range-labels">
        <span>{{ formatPrice(statistics.minPrice) }}</span>
        <span class="cs__range-title">диапазон · медиана {{ formatPrice(statistics.medianPrice) }}</span>
        <span>{{ formatPrice(statistics.maxPrice) }}</span>
      </div>
      <div class="cs__range-bar">
        <div class="cs__range-fill" />
        <div
          class="cs__range-median"
          :style="{ left: medianPosition + '%' }"
          :title="`Медиана: ${formatPrice(statistics.medianPrice)}`"
        />
      </div>
    </div>

    <!-- Формула НМЦ -->
    <div class="cs__formula">
      <div class="cs__formula-row">
        <span class="cs__formula-label">Ср. взвеш. цена</span>
        <span class="cs__formula-val">{{ formatPrice(unitPrice) }}</span>
      </div>
      <div class="cs__formula-row">
        <span class="cs__formula-label">× Количество</span>
        <span class="cs__formula-val">{{ requestedQty }}&nbsp;{{ unit }}</span>
      </div>
      <div class="cs__nmc-wrap">
        <span class="cs__nmc-label">= НМЦ контракта</span>
        <div class="cs__nmc" :class="{ 'cs__nmc--ready': hasEnoughData, 'cs__nmc--dim': !hasEnoughData }">
          {{ formatPrice(totalNmts) }}
        </div>
      </div>
    </div>

    <!-- Предупреждение -->
    <div v-if="!hasEnoughData" class="cs__warning">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L13 12H1L7 1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M7 5v3M7 9.5v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      Нужно не менее 3 источников для надёжного расчёта.
    </div>

    <!-- Действия -->
    <div class="cs__actions">
      <AppButton variant="danger" size="md" block :disabled="!hasEnoughData" @click="$emit('go-document')">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M1 1h2l1.5 7h7l1.5-6H4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="12" r="1" fill="currentColor"/>
          <circle cx="11" cy="12" r="1" fill="currentColor"/>
        </svg>
        Добавить в закупку
      </AppButton>
      <div class="cs__actions-row">
        <AppButton variant="outline" size="md" block :loading="isRecalculating" @click="$emit('recalculate')">
          <svg v-if="!isRecalculating" width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 7a5 5 0 0 1 8.5-3.5L12 2M12 2v3H9M12 7a5 5 0 0 1-8.5 3.5L2 12M2 12V9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Пересчитать
        </AppButton>
        <AppButton variant="outline" size="md" block :disabled="!hasEnoughData" @click="$emit('go-document')">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L8 1z" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8 1v5h5M5 8h4M5 10.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          Документ
        </AppButton>
      </div>
    </div>

    <!-- Обоснование — в самом низу, раскрывается по клику -->
    <div v-if="justificationText" class="cs__justification">
      <button class="cs__just-toggle" @click="showJustification = !showJustification">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/>
          <path d="M4 5h6M4 8h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        Обоснование расчёта
        <svg
          width="10" height="6" viewBox="0 0 12 7" fill="none"
          :style="{ transform: showJustification ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }"
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <Transition name="just-expand">
        <div v-if="showJustification" class="cs__just-text">
          {{ justificationText }}
        </div>
      </Transition>
    </div>

  </div>
</template>

<style scoped>
.cs {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ===== Заголовок ===== */
.cs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-gray-blue);
  background: var(--color-pale-blue);
}

.cs__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cs__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.cs__method {
  font-size: 10px;
  color: var(--color-pale-black);
}

.cs__header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.cs__version {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.cs__status-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.cs__status-badge--ok   { background: #e6f5ee; color: var(--color-green); }
.cs__status-badge--warn { background: #fff0e4; color: var(--color-orange); }

/* ===== Источники — одна строка чипов ===== */
.cs__sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cs__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-full);
  padding: 2px 8px;
}

.cs__chip strong { color: var(--color-black); font-weight: var(--font-weight-bold); }
.cs__chip--green { background: #eaf5ef; border-color: #b2ddc6; }
.cs__chip--green strong { color: var(--color-green); }
.cs__chip--orange { background: #fff4e5; border-color: #f5d49a; }
.cs__chip--orange strong { color: var(--color-orange); }
.cs__chip--gray { background: #f5f5f5; border-color: #ddd; }

.cs__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cs__dot--green  { background: var(--color-green); }
.cs__dot--orange { background: var(--color-orange); }
.cs__dot--gray   { background: var(--color-gray-blue); }

/* ===== Диапазон цен ===== */
.cs__range {
  padding: var(--space-2) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cs__range-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: var(--color-pale-black);
}

.cs__range-title {
  font-size: 10px;
  color: var(--color-pale-black);
}

.cs__range-bar {
  position: relative;
  height: 5px;
  background: var(--color-pale-blue);
  border-radius: 3px;
  overflow: visible;
}

.cs__range-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--color-main-blue), var(--color-sea-clear));
  border-radius: 3px;
}

.cs__range-median {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 11px;
  height: 11px;
  background: #fff;
  border: 2px solid var(--color-main-blue);
  border-radius: 50%;
  cursor: default;
  box-shadow: 0 0 0 2px rgba(38,75,130,0.12);
}

/* ===== Формула ===== */
.cs__formula {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cs__formula-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cs__formula-label {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.cs__formula-val {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

/* НМЦ — итоговая сумма */
.cs__nmc-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-gray-blue);
  margin-top: var(--space-1);
  gap: var(--space-2);
}

.cs__nmc-label {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  white-space: nowrap;
}

.cs__nmc {
  font-size: 1.45rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
  line-height: 1;
  text-align: right;
}

.cs__nmc--ready { color: var(--color-main-blue); }
.cs__nmc--dim   { color: var(--color-gray-light); }

/* Предупреждение */
.cs__warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: #fff8ed;
  font-size: var(--font-size-xs);
  color: #7a4400;
  line-height: 1.4;
  border-bottom: 1px solid var(--color-gray-blue);
  flex-shrink: 0;
}

/* ===== Кнопки ===== */
.cs__actions {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* Вторая строка кнопок — рядом */
.cs__actions-row {
  display: flex;
  gap: var(--space-2);
}

.cs__actions-row > * {
  flex: 1;
}

/* ===== Обоснование ===== */
.cs__justification {
  border-top: 1px solid var(--color-gray-blue);
}

.cs__just-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.cs__just-toggle:hover {
  background: var(--color-pale-blue);
}

.cs__just-text {
  padding: 0 var(--space-4) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.cs__just-text::-webkit-scrollbar       { width: 4px; }
.cs__just-text::-webkit-scrollbar-track { background: transparent; }
.cs__just-text::-webkit-scrollbar-thumb { background: var(--color-gray-blue); border-radius: 2px; }

.just-expand-enter-active,
.just-expand-leave-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  overflow: hidden;
  max-height: 350px;
}

.just-expand-enter-from,
.just-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
