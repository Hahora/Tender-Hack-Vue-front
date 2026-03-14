<script setup>
/**
 * Универсальная кнопка — реализует все варианты из дизайн-системы:
 * primary (синяя), danger (красная), outline, ghost, link
 */
defineProps({
  // Визуальный вариант кнопки
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'danger', 'outline', 'ghost', 'link'].includes(v),
  },
  // Размер кнопки
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v),
  },
  // Состояние загрузки
  loading: { type: Boolean, default: false },
  // Отключена
  disabled: { type: Boolean, default: false },
  // Иконка слева (SVG-строка или компонент-иконка не используется — просто слот)
  iconLeft: { type: Boolean, default: false },
  // Растянуть на всю ширину
  block: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<template>
  <button
    class="app-btn"
    :class="[`app-btn--${variant}`, `app-btn--${size}`, { 'app-btn--block': block, 'app-btn--loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <!-- Спиннер загрузки -->
    <span v-if="loading" class="app-btn__spinner" aria-hidden="true" />

    <!-- Слот для иконки слева -->
    <span v-if="$slots.icon" class="app-btn__icon">
      <slot name="icon" />
    </span>

    <!-- Основной текст -->
    <span class="app-btn__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-family);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-base);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    opacity var(--transition-fast);
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
  line-height: 1;
}

/* --- Размеры --- */
.app-btn--sm  { padding: 6px 12px;  font-size: var(--font-size-sm); }
.app-btn--md  { padding: 9px 20px;  font-size: var(--font-size-base); }
.app-btn--lg  { padding: 12px 28px; font-size: var(--font-size-md); }

/* --- Вариант: primary (синяя) --- */
.app-btn--primary {
  background-color: var(--color-main-blue);
  color: #fff;
  border-color: var(--color-main-blue);
}
.app-btn--primary:hover:not(:disabled) {
  background-color: #1a3660;
  border-color: #1a3660;
}

/* --- Вариант: danger (красная) --- */
.app-btn--danger {
  background-color: var(--color-red);
  color: #fff;
  border-color: var(--color-red);
}
.app-btn--danger:hover:not(:disabled) {
  background-color: #b82219;
  border-color: #b82219;
}

/* --- Вариант: outline (обводка) --- */
.app-btn--outline {
  background-color: transparent;
  color: var(--color-main-blue);
  border-color: var(--color-main-blue);
}
.app-btn--outline:hover:not(:disabled) {
  background-color: var(--color-pale-blue);
}

/* --- Вариант: ghost (без обводки) --- */
.app-btn--ghost {
  background-color: transparent;
  color: var(--color-main-blue);
  border-color: transparent;
}
.app-btn--ghost:hover:not(:disabled) {
  background-color: var(--color-pale-blue);
}

/* --- Вариант: link --- */
.app-btn--link {
  background-color: transparent;
  color: var(--color-main-blue);
  border-color: transparent;
  padding-left: 0;
  padding-right: 0;
  font-weight: var(--font-weight-regular);
}
.app-btn--link:hover:not(:disabled) {
  text-decoration: underline;
}

/* --- Состояния --- */
.app-btn:disabled,
.app-btn--loading {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

/* --- Растянуть --- */
.app-btn--block {
  width: 100%;
}

/* --- Иконка --- */
.app-btn__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/* --- Спиннер --- */
.app-btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
