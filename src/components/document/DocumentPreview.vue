<script setup>
/**
 * Предпросмотр итогового документа обоснования НМЦ.
 * Отображает сформированный текст в стилизованном блоке.
 */
import AppTag from '../ui/AppTag.vue'
import { formatDate } from '../../composables/usePriceCalculation.js'

defineProps({
  // Текст обоснования
  text:       { type: String, required: true },
  // Название СТЕ
  steQuery:   { type: String, default: '' },
  // Версия документа
  version:    { type: Number, default: 1 },
  // Дата формирования
  createdAt:  { type: String, default: '' },
})
</script>

<template>
  <div class="doc-preview">

    <!-- Шапка документа -->
    <div class="doc-preview__header">
      <div class="doc-preview__meta">
        <h2 class="doc-preview__title">
          Обоснование начальной (максимальной) цены контракта
        </h2>
        <p class="doc-preview__ste">{{ steQuery }}</p>
        <div class="doc-preview__tags">
          <AppTag color="blue">Версия {{ version }}</AppTag>
          <AppTag color="neutral">Метод сопоставимых рыночных цен</AppTag>
          <AppTag color="sea">44-ФЗ, ст. 22</AppTag>
        </div>
      </div>

      <div class="doc-preview__date">
        Сформировано<br>
        <strong>{{ formatDate(createdAt || new Date().toISOString().split('T')[0]) }}</strong>
      </div>
    </div>

    <!-- Штамп «ДОКУМЕНТ» -->
    <div class="doc-preview__stamp">
      <span class="doc-preview__stamp-text">ДОКУМЕНТ</span>
    </div>

    <!-- Текст документа -->
    <pre class="doc-preview__text">{{ text }}</pre>

    <!-- Подвал документа -->
    <div class="doc-preview__footer">
      <p class="doc-preview__footer-note">
        Документ сформирован автоматически сервисом расчёта НМЦ на основе данных ЕИС.
        Подлежит проверке специалистом контрактной службы.
      </p>
      <div class="doc-preview__footer-line" />
      <p class="doc-preview__footer-sign">Специалист контрактной службы: ___________________</p>
    </div>
  </div>
</template>

<style scoped>
.doc-preview {
  background-color: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

/* --- Шапка --- */
.doc-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  background-color: var(--color-pale-blue);
  border-bottom: 2px solid var(--color-main-blue);
}

.doc-preview__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: var(--space-2);
  line-height: 1.3;
}

.doc-preview__ste {
  font-size: var(--font-size-base);
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

.doc-preview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.doc-preview__date {
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  flex-shrink: 0;
  line-height: 1.5;
}

/* --- Штамп --- */
.doc-preview__stamp {
  position: absolute;
  top: 20px;
  right: 130px;
  transform: rotate(-12deg);
  border: 3px solid var(--color-main-blue);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  opacity: 0.08;
  pointer-events: none;
}

.doc-preview__stamp-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-main-blue);
  letter-spacing: 0.1em;
}

/* --- Текст --- */
.doc-preview__text {
  padding: var(--space-6);
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-black);
  white-space: pre-wrap;
  word-break: break-word;
  background-color: #fff;
  border-bottom: 1px solid var(--color-gray-blue);
}

/* --- Подвал --- */
.doc-preview__footer {
  padding: var(--space-5) var(--font-size-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background-color: var(--color-pale-blue);
}

.doc-preview__footer-note {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  line-height: 1.5;
}

.doc-preview__footer-line {
  height: 1px;
  background-color: var(--color-black);
  width: 200px;
}

.doc-preview__footer-sign {
  font-size: var(--font-size-sm);
  color: var(--color-black);
}
</style>
