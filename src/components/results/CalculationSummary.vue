<script setup>
import { ref, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import AppButton from "../ui/AppButton.vue";
import { formatPrice } from "../../composables/usePriceCalculation.js";
import { useCartStore } from "../../stores/cartStore.js";
import { usePriceStore } from "../../stores/priceStore.js";
import { useAuthStore } from "../../stores/authStore.js";
import { api } from "../../api/api.js";

const router     = useRouter();
const cart       = useCartStore();
const priceStore = usePriceStore();
const auth       = useAuthStore();

const props = defineProps({
  unitPrice: { type: Number, default: 0 },
  totalNmts: { type: Number, default: 0 },
  statistics: { type: Object, required: true },
  requestedQty: { type: Number, default: 1 },
  unit: { type: String, default: "шт" },
  justificationText: { type: String, default: "" },
  docVersion: { type: Number, default: 1 },
});

const emit = defineEmits([
  "update:requestedQty",
  "set-nmc",
]);

const showJustification = ref(false);
const addedToCart   = ref(false);
const updatedInCart = ref(false);

const isInCart = computed(() =>
  cart.items.some(i => i.name === priceStore.steQuery)
);

// Редактирование НМЦ вручную
const editingNmc  = ref(false);
const nmcDraft    = ref('');

function startEditNmc() {
  nmcDraft.value  = props.totalNmts ? String(Math.round(props.totalNmts)) : ''
  editingNmc.value = true
  nextTick(() => { document.querySelector('.cs__nmc-input')?.select() })
}

const manualNmc = ref(false);

function commitNmc() {
  const val = parseFloat(String(nmcDraft.value).replace(',', '.').replace(/\s/g, ''))
  if (val > 0) { emit('set-nmc', val); manualNmc.value = true }
  editingNmc.value = false
}

const hasEnoughData = computed(() => manualNmc.value || props.statistics.count >= 3);

function acQuery(filter) {
  const f = priceStore.filters
  return {
    q:         priceStore.steQuery        || undefined,
    region:    f.region                   || undefined,
    vat:       f.vatRate                  || undefined,
    date_from: f.dateFrom                 || undefined,
    date_to:   f.dateTo                   || undefined,
    unit:      priceStore.requestedUnit !== 'шт' ? priceStore.requestedUnit : undefined,
    workspace: priceStore.workspaceId     || undefined,
    filter:    filter                     || undefined,
  }
}

async function addToCart() {
  addedToCart.value = true
  try {
    const name      = priceStore.steQuery
    const quantity  = props.requestedQty || 1
    const unit      = props.unit || 'шт'
    const nmck_data = await priceStore.recalculateForCart(name, quantity, unit)
    await cart.addItem({ name, quantity, unit, unit_price: props.unitPrice, nmck_data })
  } finally {
    setTimeout(() => { addedToCart.value = false }, 2000)
  }
}

async function updateInCart() {
  updatedInCart.value = true
  try {
    const name      = priceStore.steQuery
    const quantity  = props.requestedQty || 1
    const unit      = props.unit || 'шт'
    const nmck_data = await priceStore.recalculateForCart(name, quantity, unit)
    await cart.addItem({ name, quantity, unit, unit_price: props.unitPrice, nmck_data })
  } finally {
    setTimeout(() => { updatedInCart.value = false }, 2000)
  }
}

async function removeFromCart() {
  const existing = cart.items.find(i => i.name === priceStore.steQuery)
  if (existing) await cart.removeItem(existing.id)
}

const isGeneratingDoc = ref(false)
const docError        = ref('')

async function generateSingleDoc() {
  if (isGeneratingDoc.value) return
  isGeneratingDoc.value = true
  docError.value = ''
  try {
    const name      = priceStore.steQuery
    const quantity  = props.requestedQty || 1
    const unit      = props.unit || 'шт'
    // Используем уже посчитанный nmckData из стора, если нет — пустой объект (ручной ввод цены)
    const nmck_data = priceStore.nmckData ?? {}

    let token = auth.accessToken
    let result
    try {
      result = await api.reportSingle({ name, quantity, unit, unit_price: props.unitPrice, nmck_data }, token)
    } catch (err) {
      if (err.status === 401) {
        token = await auth.refresh()
        result = await api.reportSingle({ name, quantity, unit, unit_price: props.unitPrice, nmck_data }, token)
      } else throw err
    }

    // Скачиваем файл
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url; a.download = result.filename; a.click()
    URL.revokeObjectURL(url)

    // Берём ID из истории и переходим на страницу документа
    const history = await api.reportHistory(token)
    const latest = history?.[0]
    if (latest?.id) {
      router.push({ name: 'document', params: { id: latest.id } })
    } else {
      router.push({ name: 'history' })
    }
  } catch (err) {
    docError.value = err.message || 'Ошибка при формировании документа'
  } finally {
    isGeneratingDoc.value = false
  }
}

function parseJustification(text) {
  if (!text?.trim()) return null
  const lines = text.split('\n')
  const preamble = []
  const sections = []
  let currentSection = null
  let inSections = false

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const secMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (secMatch) {
      inSections = true
      currentSection = { num: secMatch[1], title: secMatch[2].trim(), rows: [], paragraphs: [] }
      sections.push(currentSection)
    } else if (inSections && currentSection) {
      const t = line.trim()
      if (!t) continue
      const kvMatch = t.match(/^(.+?):\s{2,}(.+)$/)
      if (kvMatch) {
        currentSection.rows.push({ label: kvMatch[1].trim(), value: kvMatch[2].trim() })
      } else {
        currentSection.paragraphs.push(t)
      }
    } else {
      preamble.push(line.trim())
    }
  }
  return { preamble: preamble.filter(Boolean), sections }
}

// Позиция медианы на шкале мин–макс
const medianPosition = computed(() => {
  const { minPrice, maxPrice, medianPrice } = props.statistics;
  if (!maxPrice || maxPrice === minPrice) return 50;
  return Math.round(((medianPrice - minPrice) / (maxPrice - minPrice)) * 100);
});
</script>

<template>
  <div class="cs">
    <!-- Заголовок -->
    <div class="cs__header">
      <div class="cs__header-left">
        <h3 class="cs__title">Расчёт НМЦК</h3>
        <span class="cs__method">Метод сопоставимых рыночных цен</span>
      </div>
      <div class="cs__header-right">
        <span
          :class="[
            'cs__status-badge',
            hasEnoughData ? 'cs__status-badge--ok' : 'cs__status-badge--warn',
          ]"
        >
          {{ hasEnoughData ? "Достаточно данных" : "Мало данных" }}
        </span>
      </div>
    </div>

    <!-- Параметры расчёта -->
    <div class="cs__params">
      <span class="cs__params-label">Параметры расчёта</span>
      <div class="cs__params-fields">
        <label class="cs__param-item">
          <span class="cs__param-name">Количество</span>
          <input
            type="number"
            min="1"
            class="cs__param-input cs__param-input--qty"
            :value="requestedQty"
            @input="emit('update:requestedQty', +$event.target.value)"
          />
        </label>
        <div class="cs__param-item">
          <span class="cs__param-name">Единица</span>
          <div class="cs__param-unit-display">{{ unit || 'шт' }}</div>
        </div>
      </div>
    </div>

    <!-- Источники — статистика контрактов -->
    <div class="cs__sources">
      <span class="cs__sources-label">Контрактов</span>
      <div class="cs__sources-chips">
        <button class="cs__chip cs__chip--btn" @click="router.push({ name: 'all-contracts', query: acQuery() })">
          Всего&nbsp;<strong>{{
            statistics.count + statistics.outlierCount + statistics.excludedCount
          }}</strong>
        </button>
        <button class="cs__chip cs__chip--btn cs__chip--green" @click="router.push({ name: 'all-contracts', query: acQuery('active') })">
          <span class="cs__dot cs__dot--green" />
          Учтено&nbsp;<strong>{{ statistics.count }}</strong>
        </button>
        <button class="cs__chip cs__chip--btn cs__chip--orange" @click="router.push({ name: 'all-contracts', query: acQuery('outlier') })">
          <span class="cs__dot cs__dot--orange" />
          Выброс&nbsp;<strong>{{ statistics.outlierCount }}</strong>
        </button>
        <button v-if="statistics.excludedCount" class="cs__chip cs__chip--btn cs__chip--gray" @click="router.push({ name: 'all-contracts', query: acQuery() })">
          <span class="cs__dot cs__dot--gray" />
          Вручную&nbsp;<strong>{{ statistics.excludedCount }}</strong>
        </button>
      </div>
    </div>

    <!-- Ценовой диапазон -->
    <div class="cs__range">
      <div class="cs__range-labels">
        <span>{{ formatPrice(statistics.minPrice) }}</span>
        <span class="cs__range-title"
          >диапазон · медиана {{ formatPrice(statistics.medianPrice) }}</span
        >
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
        <input
          v-if="editingNmc"
          v-model="nmcDraft"
          type="number"
          min="0"
          class="cs__nmc-input"
          @blur="commitNmc"
          @keydown.enter.prevent="commitNmc"
          @keydown.escape="editingNmc = false"
        />
        <!-- Если данных достаточно — только отображение, без редактирования -->
        <div
          v-else-if="hasEnoughData"
          class="cs__nmc cs__nmc--ready"
        >
          {{ formatPrice(totalNmts) }}
        </div>

        <!-- Если данных мало — можно редактировать вручную -->
        <div
          v-else
          class="cs__nmc cs__nmc--editable cs__nmc--dim"
          title="Нажмите чтобы изменить вручную"
          @click="startEditNmc"
        >
          {{ formatPrice(totalNmts) }}
          <svg class="cs__nmc-edit-icon" width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Предупреждение -->
    <div v-if="!hasEnoughData" class="cs__warning">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1L13 12H1L7 1z"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path
          d="M7 5v3M7 9.5v.3"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </svg>
      Нужно не менее 3 источников для надёжного расчёта.
    </div>

    <!-- Действия -->
    <div class="cs__actions">
      <!-- Уже в корзине: Обновить + Удалить -->
      <template v-if="isInCart">
        <div class="cs__cart-row">
          <AppButton
            variant="danger"
            size="md"
            :disabled="!hasEnoughData"
            @click="updateInCart"
          >
            <svg v-if="!updatedInCart" width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7a5 5 0 0 1 8.5-3.5L12 2M12 2v3H9M12 7a5 5 0 0 1-8.5 3.5L2 12M2 12V9h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ updatedInCart ? 'Обновлено!' : 'Обновить закупку' }}
          </AppButton>
          <AppButton variant="outline" size="md" @click="removeFromCart">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M11 3.5l-.7 8a.5.5 0 01-.5.5H4.2a.5.5 0 01-.5-.5L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Удалить
          </AppButton>
        </div>
      </template>

      <!-- Не в корзине: Добавить -->
      <AppButton
        v-else
        variant="danger"
        size="md"
        block
        :disabled="!hasEnoughData"
        @click="addToCart"
      >
        <svg v-if="!addedToCart" width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M1 1h2l1.5 7h7l1.5-6H4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="12" r="1" fill="currentColor"/>
          <circle cx="11" cy="12" r="1" fill="currentColor"/>
        </svg>
        <svg v-else width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l4 4 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ addedToCart ? 'Добавлено!' : 'Добавить в закупку' }}
      </AppButton>
      <AppButton
        variant="outline"
        size="md"
        block
        :disabled="!hasEnoughData || isGeneratingDoc"
        @click="generateSingleDoc"
      >
        <span v-if="isGeneratingDoc" class="cs__doc-spinner" />
        <svg v-else width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L8 1z" stroke="currentColor" stroke-width="1.3"/>
          <path d="M8 1v5h5M5 8h4M5 10.5h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        {{ isGeneratingDoc ? 'Формируем…' : 'Сформировать документ' }}
      </AppButton>
    </div>

    <!-- Ошибка генерации документа -->
    <div v-if="docError" class="cs__doc-error">{{ docError }}</div>

    <!-- Обоснование — в самом низу, раскрывается по клику -->
    <div v-if="justificationText" class="cs__justification">
      <button
        class="cs__just-toggle"
        @click="showJustification = !showJustification"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <rect
            x="1"
            y="2"
            width="12"
            height="10"
            rx="1"
            stroke="currentColor"
            stroke-width="1.3"
          />
          <path
            d="M4 5h6M4 8h4"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
          />
        </svg>
        Обоснование расчёта
        <svg
          width="10"
          height="6"
          viewBox="0 0 12 7"
          fill="none"
          :style="{
            transform: showJustification ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms',
          }"
        >
          <path
            d="M1 1l5 5 5-5"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <Transition name="just-expand">
        <div v-if="showJustification" class="cs__just-text">
          <template v-if="parseJustification(justificationText)">
            <div class="just__preamble">
              <p v-for="(line, li) in parseJustification(justificationText).preamble" :key="li"
                :class="li === 0 ? 'just__title' : 'just__meta'">{{ line }}</p>
            </div>
            <div
              v-for="sec in parseJustification(justificationText).sections"
              :key="sec.num"
              class="just__section"
            >
              <div class="just__section-head">
                <span class="just__section-num">{{ sec.num }}</span>
                <span class="just__section-title">{{ sec.title }}</span>
              </div>
              <table v-if="sec.rows.length" class="just__table">
                <tr v-for="(row, ri) in sec.rows" :key="ri" class="just__row">
                  <td class="just__label">{{ row.label }}</td>
                  <td class="just__value">{{ row.value }}</td>
                </tr>
              </table>
              <p v-for="(p, pi) in sec.paragraphs" :key="pi" class="just__paragraph">{{ p }}</p>
            </div>
          </template>
          <span v-else class="cs__just-empty">Обоснование не сформировано</span>
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

.cs__status-badge--ok {
  background: #e6f5ee;
  color: var(--color-green);
}
.cs__status-badge--warn {
  background: #fff0e4;
  color: var(--color-orange);
}

/* ===== Параметры расчёта ===== */
.cs__params {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cs__params-label {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.cs__params-fields {
  display: flex;
  gap: var(--space-2);
}

.cs__param-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.cs__param-name {
  font-size: 11px;
  color: var(--color-pale-black);
  white-space: nowrap;
}

.cs__param-input {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 5px 8px;
  outline: none;
  height: 32px;
  width: 100%;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.cs__param-input:focus {
  border-color: var(--color-main-blue);
  background: #fff;
}

.cs__param-input--qty {
  text-align: center;
}

.cs__param-input--unit {
  text-align: left;
}

.cs__param-unit-display {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
}

/* ===== Источники — одна строка чипов ===== */
.cs__sources {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-gray-blue);
}

.cs__sources-label {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-pale-black);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
}

.cs__sources-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.cs__chip--btn {
  cursor: pointer;
  font-family: var(--font-family);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.cs__chip--btn:hover {
  border-color: var(--color-main-blue);
  background: #dce8f5;
}

.cs__chip--btn.cs__chip--green:hover  { border-color: #0d9b68; background: #cceedd; }
.cs__chip--btn.cs__chip--orange:hover { border-color: #c27000; background: #ffe5a0; }

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

.cs__chip strong {
  color: var(--color-black);
  font-weight: var(--font-weight-bold);
}
.cs__chip--green {
  background: #eaf5ef;
  border-color: #b2ddc6;
}
.cs__chip--green strong {
  color: var(--color-green);
}
.cs__chip--orange {
  background: #fff4e5;
  border-color: #f5d49a;
}
.cs__chip--orange strong {
  color: var(--color-orange);
}
.cs__chip--gray {
  background: #f5f5f5;
  border-color: #ddd;
}

.cs__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cs__dot--green {
  background: var(--color-green);
}
.cs__dot--orange {
  background: var(--color-orange);
}
.cs__dot--gray {
  background: var(--color-gray-blue);
}

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
  background: linear-gradient(
    90deg,
    var(--color-main-blue),
    var(--color-sea-clear)
  );
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
  box-shadow: 0 0 0 2px rgba(38, 75, 130, 0.12);
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

.cs__nmc--ready {
  color: var(--color-main-blue);
}
.cs__nmc--dim {
  color: var(--color-gray-light);
}

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

.cs__cart-row {
  display: flex;
  gap: var(--space-2);
}

.cs__doc-error {
  margin: 0 var(--space-4) var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: #fdecea;
  border: 1px solid #f5b7b1;
  border-radius: var(--radius-base);
  font-size: var(--font-size-xs);
  color: #a03030;
}

.cs__doc-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-gray-blue);
  border-top-color: var(--color-main-blue);
  border-radius: 50%;
  animation: cs-spin 0.7s linear infinite;
}
@keyframes cs-spin { to { transform: rotate(360deg); } }

.cs__nmc--editable {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}
.cs__nmc--editable:hover { opacity: 0.8; }

.cs__nmc-edit-icon {
  color: var(--color-pale-black);
  flex-shrink: 0;
  opacity: 0.5;
}

.cs__nmc-input {
  font-family: var(--font-family);
  font-size: 1.45rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1.5px solid var(--color-main-blue);
  border-radius: var(--radius-base);
  padding: 2px 8px;
  outline: none;
  width: 100%;
  text-align: right;
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
  background: #fff;
  max-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.cs__just-text::-webkit-scrollbar {
  width: 4px;
}
.cs__just-text::-webkit-scrollbar-track {
  background: transparent;
}
.cs__just-text::-webkit-scrollbar-thumb {
  background: var(--color-gray-blue);
  border-radius: 2px;
}

/* ===== Структурированное обоснование ===== */
.just__preamble {
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-gray-blue);
  margin-bottom: var(--space-2);
}

.just__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  margin-bottom: 2px;
}

.just__meta {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.just__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-gray-blue);
}

.just__section:last-child { border-bottom: none; }

.just__section-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 4px;
}

.just__section-num {
  width: 18px;
  height: 18px;
  background: var(--color-main-blue);
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.just__section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.just__table {
  width: 100%;
  border-collapse: collapse;
}

.just__row:not(:last-child) .just__label,
.just__row:not(:last-child) .just__value {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.just__label {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 3px 8px 3px 0;
  width: 55%;
  vertical-align: top;
}

.just__value {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  padding: 3px 0;
  vertical-align: top;
}

.just__paragraph {
  font-size: var(--font-size-xs);
  color: var(--color-black);
  line-height: 1.5;
}

.cs__just-empty {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
}

.just-expand-enter-active,
.just-expand-leave-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  overflow: hidden;
  max-height: 230px;
}

.just-expand-enter-from,
.just-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
