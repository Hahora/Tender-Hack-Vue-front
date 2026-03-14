<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  regions:    { type: Array,  default: () => [] },
  activeCount:{ type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'reset'])

function update(key, val) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
</script>

<template>
  <div class="pf">
    <span class="pf__label">Фильтры:</span>

    <!-- Регион -->
    <div class="pf__field">
      <label class="pf__field-label">Регион</label>
      <div class="pf__select-wrap">
        <select
          class="pf__select"
          :value="modelValue.region"
          @change="update('region', $event.target.value)"
        >
          <option value="">Все регионы</option>
          <option v-for="r in regions" :key="r.value ?? r" :value="r.value ?? r">
            {{ r.label ?? r }}
          </option>
        </select>
        <svg class="pf__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <div class="pf__sep" />

    <!-- НДС -->
    <div class="pf__field">
      <label class="pf__field-label">НДС</label>
      <div class="pf__select-wrap">
        <select
          class="pf__select pf__select--narrow"
          :value="modelValue.vatRate"
          @change="update('vatRate', $event.target.value)"
        >
          <option value="">Любой</option>
          <option value="20">20%</option>
          <option value="10">10%</option>
          <option value="0">0%</option>
          <option value="-1">Без НДС</option>
        </select>
        <svg class="pf__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <div class="pf__sep" />

    <!-- Дата от -->
    <div class="pf__field">
      <label class="pf__field-label">С</label>
      <input
        type="date"
        class="pf__date"
        :value="modelValue.dateFrom"
        @change="update('dateFrom', $event.target.value)"
      />
    </div>

    <!-- Дата до -->
    <div class="pf__field">
      <label class="pf__field-label">По</label>
      <input
        type="date"
        class="pf__date"
        :value="modelValue.dateTo"
        @change="update('dateTo', $event.target.value)"
      />
    </div>

    <!-- Кнопка сброса -->
    <Transition name="pf-reset">
      <button v-if="activeCount" class="pf__reset" @click="$emit('reset')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        Сбросить ({{ activeCount }})
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.pf {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.pf__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  white-space: nowrap;
  margin-right: var(--space-1);
}

/* Разделитель */
.pf__sep {
  width: 1px;
  height: 20px;
  background: var(--color-gray-blue);
  flex-shrink: 0;
}

/* Поле */
.pf__field {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pf__field-label {
  font-size: 11px;
  color: var(--color-pale-black);
  white-space: nowrap;
  flex-shrink: 0;
}

/* Обёртка select */
.pf__select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.pf__select {
  height: 32px;
  padding: 0 28px 0 10px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  outline: none;
  appearance: none;
  cursor: pointer;
  min-width: 120px;
  transition: border-color var(--transition-fast);
}

.pf__select:focus { border-color: var(--color-main-blue); }
.pf__select--narrow { min-width: 80px; }

.pf__chevron {
  position: absolute;
  right: 8px;
  color: var(--color-pale-black);
  pointer-events: none;
  flex-shrink: 0;
}

/* Дата */
.pf__date {
  height: 32px;
  padding: 0 10px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.pf__date:focus { border-color: var(--color-main-blue); }

/* Сегментированные кнопки */
.pf__seg {
  display: flex;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  overflow: hidden;
  height: 32px;
}

.pf__seg-btn {
  padding: 0 10px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  background: #fff;
  border: none;
  border-right: 1px solid var(--color-gray-blue);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.pf__seg-btn:last-child { border-right: none; }
.pf__seg-btn:hover { background: var(--color-pale-blue); }

.pf__seg-btn--active {
  background: var(--color-main-blue);
  color: #fff;
}

/* Кнопка сброса */
.pf__reset {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-red);
  background: #fdecea;
  border: 1px solid #f5beba;
  border-radius: var(--radius-base);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
  margin-left: auto;
}

.pf__reset:hover { background: #fbd7d5; }

/* Анимация появления кнопки сброса */
.pf-reset-enter-active, .pf-reset-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.pf-reset-enter-from, .pf-reset-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Мобильный */
@media (max-width: 640px) {
  .pf { gap: var(--space-2) var(--space-3); }
  .pf__sep { display: none; }
  .pf__select { min-width: 100px; }
}
</style>
