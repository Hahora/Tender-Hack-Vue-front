<script setup>
/**
 * Выпадающий список — обёртка над нативным <select>
 */
defineProps({
  modelValue: { type: String, default: '' },
  options: {
    type: Array,
    default: () => [],
    // Массив строк или { value, label }
  },
  label:       { type: String, default: '' },
  placeholder: { type: String, default: 'Выберите...' },
  disabled:    { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="app-select" :class="{ 'app-select--disabled': disabled }">
    <label v-if="label" class="app-select__label">{{ label }}</label>
    <div class="app-select__wrap">
      <select
        class="app-select__field"
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="">{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="typeof opt === 'string' ? opt : opt.value"
          :value="typeof opt === 'string' ? opt : opt.value"
        >
          {{ typeof opt === 'string' ? opt : opt.label }}
        </option>
      </select>
      <!-- Стрелка вниз -->
      <span class="app-select__arrow" aria-hidden="true">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped>
.app-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.app-select__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
}

.app-select__wrap {
  position: relative;
}

.app-select__field {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 12px;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  background-color: var(--color-bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-base);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.app-select__field:focus {
  border-color: var(--border-color-focus);
  box-shadow: 0 0 0 3px rgba(38, 75, 130, 0.12);
}

.app-select--disabled .app-select__field {
  background-color: var(--color-pale-blue);
  color: var(--color-pale-black);
  cursor: not-allowed;
}

.app-select__arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-pale-black);
  pointer-events: none;
}
</style>
