<script setup>
/**
 * Поле ввода — текстовое, числовое, поиск.
 * Поддерживает v-model, валидацию, иконку, подпись.
 */
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type:       { type: String, default: 'text' },
  placeholder:{ type: String, default: '' },
  label:      { type: String, default: '' },
  hint:       { type: String, default: '' },
  error:      { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  required:   { type: Boolean, default: false },
  // Иконка справа (строка символа или передаётся через слот)
  iconRight:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'enter'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

function onKeydown(e) {
  if (e.key === 'Enter') emit('enter', e)
}
</script>

<template>
  <div class="app-input" :class="{ 'app-input--error': error, 'app-input--disabled': disabled }">
    <!-- Подпись -->
    <label v-if="label" class="app-input__label">
      {{ label }}
      <span v-if="required" class="app-input__required" title="Обязательное поле">*</span>
    </label>

    <!-- Обёртка поля -->
    <div class="app-input__wrap">
      <input
        class="app-input__field"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
      />

      <!-- Слот для иконки справа -->
      <span v-if="$slots.iconRight" class="app-input__icon-right">
        <slot name="iconRight" />
      </span>
    </div>

    <!-- Подсказка или ошибка -->
    <p v-if="error" class="app-input__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="app-input__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* --- Подпись --- */
.app-input__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  line-height: 1.3;
}

.app-input__required {
  color: var(--color-red);
  margin-left: 2px;
}

/* --- Обёртка --- */
.app-input__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* --- Поле --- */
.app-input__field {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-black);
  background-color: var(--color-bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-base);
  outline: none;
  transition: border-color var(--transition-fast);
}

.app-input__field::placeholder {
  color: var(--color-gray);
}

.app-input__field:focus {
  border-color: var(--border-color-focus);
  box-shadow: 0 0 0 3px rgba(38, 75, 130, 0.12);
}

/* --- Состояние ошибки --- */
.app-input--error .app-input__field {
  border-color: var(--border-color-error);
}
.app-input--error .app-input__field:focus {
  box-shadow: 0 0 0 3px rgba(219, 43, 33, 0.12);
}

/* --- Отключено --- */
.app-input--disabled .app-input__field {
  background-color: var(--color-pale-blue);
  color: var(--color-pale-black);
  cursor: not-allowed;
}

/* --- Иконка справа --- */
.app-input__icon-right {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  color: var(--color-pale-black);
  pointer-events: none;
}

/* --- Подсказка и ошибка --- */
.app-input__hint  { font-size: var(--font-size-sm); color: var(--color-pale-black); }
.app-input__error { font-size: var(--font-size-sm); color: var(--color-red); }
</style>
