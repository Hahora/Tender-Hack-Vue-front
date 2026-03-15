<script setup>
import { ref } from "vue";
import AppButton from "../ui/AppButton.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["search"]);

const query = ref("");
const inputRef = ref(null);

function doSearch() {
  const q = query.value.trim();
  if (!q) return;
  emit("search", q);
}
</script>

<template>
  <div class="search-form">
    <div class="search-form__wrap">
      <!-- Иконка поиска слева -->
      <span class="search-form__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle
            cx="8.5"
            cy="8.5"
            r="6.5"
            stroke="#7F8792"
            stroke-width="1.8"
          />
          <path
            d="M14 14l4.5 4.5"
            stroke="#7F8792"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <!-- Поле ввода -->
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        class="search-form__input"
        placeholder="Введите наименование СТЕ"
        aria-label="Поиск СТЕ"
        autocomplete="off"
        @keydown.enter="doSearch"
      />

      <!-- Кнопка очистки -->
      <button
        v-if="query"
        class="search-form__clear"
        type="button"
        aria-label="Очистить поиск"
        @click="
          query = '';
          inputRef?.focus();
        "
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1l12 12M13 1L1 13"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <!-- Кнопка поиска -->
      <AppButton
        class="search-form__btn"
        variant="primary"
        size="md"
        :loading="loading"
        @click="doSearch"
      >
        <span class="search-form__btn-text">Найти цены</span>
        <svg
          class="search-form__btn-icon"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8.5"
            cy="8.5"
            r="6.5"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="M14 14l4.5 4.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.search-form {
  position: relative;
  width: 100%;
}

/* --- Обёртка поля --- */
.search-form__wrap {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 2px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: 4px 4px 4px 16px;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.search-form__wrap:focus-within,
.search-form__wrap--open {
  border-color: var(--color-main-blue);
  box-shadow: 0 0 0 3px rgba(38, 75, 130, 0.1);
}

/* --- Иконка --- */
.search-form__icon {
  display: flex;
  flex-shrink: 0;
}

/* --- Поле ввода --- */
.search-form__input {
  flex: 1;
  border: none;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  color: var(--color-black);
  background: transparent;
  min-width: 0;
  padding: 8px 0;
}

.search-form__input::placeholder {
  color: var(--color-gray);
}

/* Убираем системную иконку очистки браузера */
.search-form__input::-webkit-search-cancel-button {
  display: none;
}

/* --- Кнопка очистки --- */
.search-form__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-pale-black);
  border-radius: var(--radius-base);
  flex-shrink: 0;
  transition: color var(--transition-fast),
    background-color var(--transition-fast);
}

.search-form__clear:hover {
  color: var(--color-red);
  background-color: var(--color-pale-blue);
}

/* --- Кнопка поиска --- */
.search-form__btn {
  flex-shrink: 0;
  border-radius: var(--radius-base) !important;
}

.search-form__btn-icon {
  display: none;
}

@media (max-width: 480px) {
  .search-form__btn-text {
    display: none;
  }
  .search-form__btn-icon {
    display: block;
  }
  .search-form__btn {
    width: 38px !important;
    height: 38px !important;
    padding: 0 !important;
    justify-content: center;
  }
}
</style>
