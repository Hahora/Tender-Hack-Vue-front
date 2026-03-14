<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  regions:    { type: Array,  default: () => [] },
  activeCount:{ type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'reset'])

function update(key, val) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}

/* ─── Кастомный дроп для региона ─── */
const showRegionDrop = ref(false)
const regionSearch   = ref('')

const filteredRegions = computed(() => {
  const q = regionSearch.value.trim().toLowerCase()
  if (!q) return props.regions
  return props.regions.filter(r => r.toLowerCase().includes(q))
})

const selectedRegionLabel = computed(() =>
  props.modelValue.region || 'Все регионы'
)

function selectRegion(r) {
  update('region', r)
  showRegionDrop.value = false
  regionSearch.value   = ''
}

function clearRegion() {
  update('region', '')
  showRegionDrop.value = false
  regionSearch.value   = ''
}

function toggleRegionDrop() {
  showRegionDrop.value = !showRegionDrop.value
  if (!showRegionDrop.value) regionSearch.value = ''
}

function onRegionBlur(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    showRegionDrop.value = false
    regionSearch.value   = ''
  }
}
</script>

<template>
  <div class="pf">
    <span class="pf__label">Фильтры:</span>

    <!-- Регион — кастомный дроп с поиском -->
    <div class="pf__field">
      <label class="pf__field-label">Регион</label>
      <div
        class="pf__drop-wrap"
        tabindex="-1"
        @blur.capture="onRegionBlur"
      >
        <button
          class="pf__drop-trigger"
          :class="{ 'pf__drop-trigger--active': modelValue.region }"
          @click="toggleRegionDrop"
        >
          <span class="pf__drop-trigger-text">{{ selectedRegionLabel }}</span>
          <svg
            width="9" height="5" viewBox="0 0 9 5" fill="none"
            class="pf__drop-chevron"
            :style="showRegionDrop ? 'transform:rotate(180deg)' : ''"
          >
            <path d="M1 1l3.5 3L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div v-if="showRegionDrop" class="pf__drop">
          <!-- Поиск -->
          <div class="pf__drop-search-wrap">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" class="pf__drop-search-icon">
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M8 8l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <input
              v-model="regionSearch"
              class="pf__drop-search"
              placeholder="Поиск…"
              autocomplete="off"
            />
          </div>

          <!-- Список -->
          <div class="pf__drop-list">
            <button class="pf__drop-item" :class="{ 'pf__drop-item--active': !modelValue.region }" @click="clearRegion">
              Все регионы
            </button>
            <p v-if="filteredRegions.length === 0" class="pf__drop-empty">Не найдено</p>
            <button
              v-for="r in filteredRegions"
              :key="r"
              class="pf__drop-item"
              :class="{ 'pf__drop-item--active': r === modelValue.region }"
              @click="selectRegion(r)"
            >{{ r }}</button>
          </div>
        </div>
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

.pf__sep {
  width: 1px;
  height: 20px;
  background: var(--color-gray-blue);
  flex-shrink: 0;
}

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

/* ─── Кастомный дроп региона ─── */
.pf__drop-wrap {
  position: relative;
  outline: none;
}

.pf__drop-trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 8px 0 10px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-black);
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  white-space: nowrap;
  max-width: 200px;
  transition: border-color var(--transition-fast);
}

.pf__drop-trigger:hover,
.pf__drop-trigger--active {
  border-color: var(--color-main-blue);
}

.pf__drop-trigger--active {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
}

.pf__drop-trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 80px;
  max-width: 160px;
}

.pf__drop-chevron {
  color: var(--color-pale-black);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.pf__drop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 260px;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 300;
  overflow: hidden;
}

.pf__drop-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--color-gray-blue);
}

.pf__drop-search-icon {
  color: var(--color-pale-black);
  flex-shrink: 0;
}

.pf__drop-search {
  flex: 1;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  background: none;
  border: none;
  outline: none;
  padding: 0;
}

.pf__drop-search::placeholder { color: var(--color-pale-black); }

.pf__drop-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.pf__drop-empty {
  font-size: var(--font-size-xs);
  color: var(--color-pale-black);
  padding: 10px;
  text-align: center;
}

.pf__drop-item {
  display: block;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--color-black);
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background var(--transition-fast);
}

.pf__drop-item:hover { background: var(--color-pale-blue); }

.pf__drop-item--active {
  color: var(--color-main-blue);
  font-weight: var(--font-weight-semibold);
  background: var(--color-pale-blue);
}

/* ─── Нативный select (НДС) ─── */
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

/* ─── Дата ─── */
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

/* ─── Кнопка сброса ─── */
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

.pf-reset-enter-active, .pf-reset-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.pf-reset-enter-from, .pf-reset-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .pf { gap: var(--space-2) var(--space-3); }
  .pf__sep { display: none; }
  .pf__drop-trigger-text { max-width: 110px; }
}
</style>
