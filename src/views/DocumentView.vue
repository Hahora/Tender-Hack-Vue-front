<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore.js'
import { formatPrice } from '../composables/usePriceCalculation.js'

const router = useRouter()
const cart   = useCartStore()

// Снапшот корзины на момент открытия документа
let docItems    = []
let docTotal    = 0

if (cart.items.length === 0) {
  router.replace({ name: 'cart' })
} else {
  // Сохраняем снапшот, затем архивируем и очищаем корзину
  docItems = cart.items.map(i => ({ ...i }))
  docTotal = cart.grandTotal
  cart.archiveCart()
}

const today = new Date().toLocaleDateString('ru-RU', {
  day: '2-digit', month: 'long', year: 'numeric'
})

function download() {
  const lines = []
  lines.push('ОБОСНОВАНИЕ НАЧАЛЬНОЙ (МАКСИМАЛЬНОЙ) ЦЕНЫ КОНТРАКТА')
  lines.push('Метод сопоставимых рыночных цен (анализ рынка)')
  lines.push(`Дата составления: ${today}`)
  lines.push('─'.repeat(70))
  lines.push('')

  docItems.forEach((item, idx) => {
    lines.push(`Позиция ${idx + 1}: ${item.customName}`)
    lines.push(`Количество: ${item.requestedQty} ${item.requestedUnit}`)
    lines.push(`Цена за единицу: ${formatPrice(item.unitPrice)}`)
    lines.push(`НМЦ позиции: ${formatPrice(item.totalNmts)}`)
    lines.push(`Источников: ${item.sourcesCount} контрактов`)
    lines.push('')
    lines.push('Обоснование:')
    lines.push(item.justificationText)
    lines.push('')
    lines.push('─'.repeat(70))
    lines.push('')
  })

  lines.push(`ИТОГОВАЯ НМЦ КОНТРАКТА: ${formatPrice(docTotal)}`)
  lines.push('')
  lines.push('Правовая основа:')
  lines.push('- 44-ФЗ, ст. 22 — метод анализа рынка')
  lines.push('- Приказ МЭР № 567 — порядок определения НМЦ')
  lines.push('- Письмо Минфина № 24-01-10/15799')

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Обоснование_НМЦ_${new Date().toISOString().slice(0,10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="dv">
    <div class="container">

      <!-- Навигация -->
      <div class="dv__nav">
        <button class="dv__back" @click="router.back()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          В корзину
        </button>
        <div class="dv__actions">
          <button class="dv__btn dv__btn--outline" onclick="window.print()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="4" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 4V2h6v2M4 10h6v3H4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            Печать
          </button>
          <button class="dv__btn dv__btn--primary" @click="download">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Скачать (.txt)
          </button>
        </div>
      </div>

      <!-- Документ -->
      <div class="dv__doc">

        <!-- Шапка документа -->
        <div class="dv__doc-header">
          <div class="dv__doc-stamp">
            <span class="dv__doc-stamp-label">УТВЕРЖДАЮ</span>
            <span class="dv__doc-stamp-line">________________________</span>
            <span class="dv__doc-stamp-sub">Руководитель организации</span>
            <span class="dv__doc-stamp-line">________________________</span>
            <span class="dv__doc-stamp-sub">{{ today }}</span>
          </div>
          <div class="dv__doc-title-block">
            <h1 class="dv__doc-title">Обоснование начальной (максимальной) цены контракта</h1>
            <p class="dv__doc-method">Метод сопоставимых рыночных цен (анализ рынка)</p>
            <p class="dv__doc-date">Дата составления: {{ today }}</p>
          </div>
        </div>

        <!-- Таблица позиций -->
        <div class="dv__section">
          <h2 class="dv__section-title">1. Перечень закупаемых позиций</h2>
          <table class="dv__table">
            <thead>
              <tr>
                <th class="dv__th dv__th--num">№</th>
                <th class="dv__th">Наименование позиции</th>
                <th class="dv__th dv__th--num">Кол-во</th>
                <th class="dv__th">Ед.</th>
                <th class="dv__th dv__th--price">Цена / ед.</th>
                <th class="dv__th dv__th--price">НМЦ позиции</th>
                <th class="dv__th dv__th--num">Источников</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in docItems" :key="item.id" class="dv__tr">
                <td class="dv__td dv__td--num dv__td--muted">{{ idx + 1 }}</td>
                <td class="dv__td dv__td--name">{{ item.customName }}</td>
                <td class="dv__td dv__td--num">{{ item.requestedQty }}</td>
                <td class="dv__td dv__td--num">{{ item.requestedUnit }}</td>
                <td class="dv__td dv__td--price">{{ formatPrice(item.unitPrice) }}</td>
                <td class="dv__td dv__td--price dv__td--bold">{{ formatPrice(item.totalNmts) }}</td>
                <td class="dv__td dv__td--num dv__td--muted">{{ item.sourcesCount }}</td>
              </tr>
              <tr class="dv__tr dv__tr--total">
                <td class="dv__td" colspan="5">Итоговая НМЦ контракта</td>
                <td class="dv__td dv__td--price dv__td--grand" colspan="2">{{ formatPrice(docTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Обоснование по каждой позиции -->
        <div class="dv__section">
          <h2 class="dv__section-title">2. Обоснование по позициям</h2>
          <div
            v-for="(item, idx) in docItems"
            :key="item.id + '-just'"
            class="dv__just-block"
          >
            <h3 class="dv__just-title">{{ idx + 1 }}. {{ item.customName }}</h3>
            <div class="dv__just-meta">
              <span>Количество: <strong>{{ item.requestedQty }} {{ item.requestedUnit }}</strong></span>
              <span>Цена / ед.: <strong>{{ formatPrice(item.unitPrice) }}</strong></span>
              <span>НМЦ: <strong>{{ formatPrice(item.totalNmts) }}</strong></span>
              <span>Источников: <strong>{{ item.sourcesCount }}</strong></span>
            </div>
            <p class="dv__just-text">{{ item.justificationText }}</p>
          </div>
        </div>

        <!-- Правовая основа -->
        <div class="dv__section">
          <h2 class="dv__section-title">3. Правовая основа</h2>
          <ul class="dv__legal">
            <li>Федеральный закон от 05.04.2013 № 44-ФЗ, статья 22 — метод анализа рынка</li>
            <li>Приказ Министерства экономического развития РФ от 02.10.2013 № 567</li>
            <li>Письмо Министерства финансов РФ № 24-01-10/15799</li>
          </ul>
        </div>

        <!-- Подписи -->
        <div class="dv__signatures">
          <div class="dv__sign">
            <span class="dv__sign-role">Исполнитель</span>
            <span class="dv__sign-line">____________________</span>
            <span class="dv__sign-hint">подпись / дата</span>
          </div>
          <div class="dv__sign">
            <span class="dv__sign-role">Руководитель</span>
            <span class="dv__sign-line">____________________</span>
            <span class="dv__sign-hint">подпись / дата</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.dv {
  background: #f5f8fc;
  min-height: 100vh;
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

.dv__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.dv__back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.dv__back:hover { text-decoration: underline; }

.dv__actions { display: flex; gap: var(--space-2); }

.dv__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-base);
  padding: 7px 16px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
}
.dv__btn--outline { color: var(--color-main-blue); background: #fff; border: 1px solid var(--color-gray-blue); }
.dv__btn--outline:hover { background: var(--color-pale-blue); border-color: var(--color-main-blue); }
.dv__btn--primary { color: #fff; background: var(--color-main-blue); border: 1px solid var(--color-main-blue); }
.dv__btn--primary:hover { background: #1a3a6e; }

/* Документ */
.dv__doc {
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  padding: 48px 56px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  max-width: 900px;
  margin: 0 auto;
}

@media print {
  .dv__nav { display: none; }
  .dv { background: #fff; padding: 0; }
  .dv__doc { border: none; box-shadow: none; padding: 20px; }
}

/* Шапка документа */
.dv__doc-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-6);
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 2px solid var(--color-black);
}

.dv__doc-stamp {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  font-size: var(--font-size-xs);
}
.dv__doc-stamp-label { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); letter-spacing: 0.05em; }
.dv__doc-stamp-line { color: var(--color-pale-black); margin-top: 12px; }
.dv__doc-stamp-sub { font-size: 10px; color: var(--color-pale-black); }

.dv__doc-title-block { text-align: center; }
.dv__doc-title {
  font-size: 1.05rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.4;
  margin-bottom: var(--space-2);
}
.dv__doc-method { font-size: var(--font-size-sm); color: var(--color-pale-black); margin-bottom: 4px; }
.dv__doc-date { font-size: var(--font-size-xs); color: var(--color-pale-black); }

/* Секции */
.dv__section { margin-bottom: 36px; }
.dv__section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-gray-blue);
}

/* Таблица */
.dv__table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.dv__th {
  text-align: left;
  padding: 8px 10px;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.dv__th--num { text-align: center; width: 50px; }
.dv__th--price { text-align: right; }

.dv__td { padding: 10px; border: 1px solid var(--color-gray-blue); color: var(--color-black); vertical-align: middle; }
.dv__td--num { text-align: center; }
.dv__td--price { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dv__td--bold { font-weight: var(--font-weight-bold); }
.dv__td--muted { color: var(--color-pale-black); font-size: var(--font-size-xs); }
.dv__td--name { font-weight: var(--font-weight-semibold); }
.dv__tr:nth-child(even) .dv__td { background: #fafbfd; }

.dv__tr--total .dv__td {
  background: var(--color-pale-blue);
  font-weight: var(--font-weight-semibold);
  border-top: 2px solid var(--color-main-blue);
}
.dv__td--grand { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-main-blue); }

/* Обоснование */
.dv__just-block {
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: #fafbfd;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  border-left: 3px solid var(--color-main-blue);
}
.dv__just-title { font-size: var(--font-size-base); font-weight: var(--font-weight-bold); margin-bottom: var(--space-2); }
.dv__just-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}
.dv__just-meta strong { color: var(--color-black); font-weight: var(--font-weight-semibold); }
.dv__just-text { font-size: var(--font-size-sm); line-height: 1.7; white-space: pre-wrap; }

/* Правовая основа */
.dv__legal { font-size: var(--font-size-sm); line-height: 1.8; padding-left: var(--space-5); }
.dv__legal li::marker { color: var(--color-main-blue); }

/* Подписи */
.dv__signatures {
  display: flex;
  gap: 80px;
  padding-top: 32px;
  border-top: 1px solid var(--color-gray-blue);
}
.dv__sign { display: flex; flex-direction: column; gap: 4px; }
.dv__sign-role { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-pale-black); }
.dv__sign-line { font-size: var(--font-size-lg); color: var(--color-gray-light); margin-top: 24px; }
.dv__sign-hint { font-size: 10px; color: var(--color-pale-black); }

@media (max-width: 768px) {
  .dv__doc { padding: 24px 20px; }
  .dv__doc-header { grid-template-columns: 1fr; }
  .dv__signatures { gap: 40px; flex-wrap: wrap; }
}
</style>
