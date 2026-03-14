<script setup>
/**
 * Тег / статус — цветная метка для отображения статусов из дизайн-системы
 */
defineProps({
  // Цветовой вариант статуса
  color: {
    type: String,
    default: 'neutral',
    validator: v => ['blue', 'green', 'red', 'orange', 'sea', 'neutral', 'gray'].includes(v),
  },
  // Маленький точечный индикатор слева
  dot: { type: Boolean, default: false },
})
</script>

<template>
  <span class="app-tag" :class="`app-tag--${color}`">
    <span v-if="dot" class="app-tag__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.app-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: var(--radius-full);
  line-height: 1.6;
  white-space: nowrap;
}

/* --- Точка --- */
.app-tag__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  flex-shrink: 0;
}

/* --- Цвета --- */
.app-tag--blue    { background-color: var(--color-pale-blue);   color: var(--color-main-blue); }
.app-tag--green   { background-color: #e6f5ee;                  color: var(--color-green); }
.app-tag--red     { background-color: #fdecea;                  color: var(--color-red); }
.app-tag--orange  { background-color: #fff0e4;                  color: var(--color-orange); }
.app-tag--sea     { background-color: #e4f4f5;                  color: var(--color-sea-dark); }
.app-tag--neutral { background-color: var(--color-gray-blue);   color: var(--color-gray); }
.app-tag--gray    { background-color: #eaecef;                  color: var(--color-pale-black); }
</style>
