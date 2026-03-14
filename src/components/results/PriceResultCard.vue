<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { formatPrice } from "../../composables/usePriceCalculation.js";

const router = useRouter();

const props = defineProps({
  procurement: { type: Object, required: true },
  index: { type: Number, default: 0 },
});

const emit = defineEmits(["toggle-exclude"]);

const statusMap = {
  excluded: {
    label: "Исключено",
    color: "#8c8c8c",
    bg: "#f5f5f5",
    border: "#c0c0c0",
  },
  outlier: {
    label: "Выброс IQR",
    color: "#c27000",
    bg: "#fff6e4",
    border: "#f9c56a",
  },
  manual: {
    label: "Вручную",
    color: "#167c85",
    bg: "#e4f4f5",
    border: "#48b8c2",
  },
  active: {
    label: "Учтено",
    color: "#264b82",
    bg: "#eaf1fb",
    border: "#264b82",
  },
};

const status = computed(() => {
  const p = props.procurement;
  if (p.isExcluded) return statusMap.excluded;
  if (p.manualPrice) return statusMap.manual;
  return statusMap.active;
});

const isManualEntry = computed(() => props.procurement.id.startsWith("MAN-"));

function goToContractDetail() {
  if (props.procurement.contractNumber) {
    router.push({
      name: "contract-detail",
      params: { number: props.procurement.contractNumber },
    });
  } else {
    router.push({ name: "contracts", params: { ste: props.procurement.steNumber } });
  }
}

function goToSteDetail() {
  router.push({
    name: "ste-detail",
    params: { id: props.procurement.steNumber },
  });
}

function goToContracts() {
  router.push({ name: "contracts", params: { ste: props.procurement.steNumber } });
}
</script>

<template>
  <div
    class="prc"
    :class="{ 'prc--excluded': procurement.isExcluded }"
    :style="{ '--accent': status.border }"
  >
    <div class="prc__accent" />

    <div class="prc__inner">
      <!-- Единая строка -->
      <div class="prc__row">
        <!-- Левая часть: мета + название -->
        <div class="prc__left">
          <div class="prc__meta">
            <span class="prc__num">{{ index + 1 }}</span>
            <button class="prc__id prc__link" @click="goToSteDetail">
              {{ procurement.steNumber }}
            </button>
            <span v-if="isManualEntry" class="prc__badge-manual"
              >Ручной ввод</span
            >
            <span
              v-if="procurement.isExcluded"
              class="prc__status"
              :style="{ color: status.color, background: status.bg }"
            >
              <span
                class="prc__status-dot"
                :style="{ background: status.color }"
              />
              {{ status.label }}
            </span>
          </div>
          <span class="prc__name">{{ procurement.name }}</span>
        </div>

        <!-- Правая часть: цена + кнопки -->
        <div class="prc__right">
          <div class="prc__price-area">
            <div class="prc__price-row">
              <span class="prc__price">{{
                formatPrice(procurement.unitPrice)
              }}</span>
              <span class="prc__price-unit"
                >&nbsp;/&nbsp;{{ procurement.unit }}</span
              >
            </div>
            <div class="prc__price-note">по последнему контракту</div>
          </div>
          <div class="prc__actions">
            <button
              class="prc__action"
              :class="{ 'prc__action--restore': procurement.isExcluded }"
              @click="$emit('toggle-exclude', procurement.id)"
            >
              <svg
                v-if="!procurement.isExcluded"
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
              >
                <circle
                  cx="5.5"
                  cy="5.5"
                  r="4.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                />
                <path
                  d="M3 5.5l2 2 3-3.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              <svg
                v-else
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
              >
                <circle
                  cx="5.5"
                  cy="5.5"
                  r="4.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                />
                <path
                  d="M3.5 3.5l4 4M7.5 3.5l-4 4"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              {{ procurement.isExcluded ? "Включить в расчёт" : "Исключить" }}
            </button>

            <button
              v-if="!isManualEntry"
              class="prc__action"
              @click="goToContracts"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M6 1.5H2.5A1 1 0 0 0 1.5 2.5v6A1 1 0 0 0 2.5 9.5h6A1 1 0 0 0 9.5 8.5V5M7.5 1.5h2v2M5 6l4.5-4.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Контракты
            </button>
            <button class="prc__action prc__action--ste" @click="goToSteDetail">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect
                  x="1.5"
                  y="1.5"
                  width="8"
                  height="8"
                  rx="1"
                  stroke="currentColor"
                  stroke-width="1.2"
                />
                <path
                  d="M3.5 4h4M3.5 6h2.5"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              О СТЕ
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.prc {
  display: flex;
  background: #fff;
  border: 1px solid var(--color-gray-blue);
  border-left: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.prc:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.prc--excluded {
  opacity: 0.55;
  background: #fafafa;
}
.prc--outlier {
  background: #fffcf5;
}

.prc__accent {
  width: 4px;
  flex-shrink: 0;
  background: var(--accent, #d4dbe6);
}

.prc__inner {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

/* Единая строка карточки */
.prc__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.prc__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.prc__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.prc__num {
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pale-blue);
  color: var(--color-main-blue);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.prc__id {
  font-size: var(--font-size-sm);
  color: var(--color-main-blue);
  text-decoration: underline;
  text-decoration-color: rgba(38, 75, 130, 0.35);
  text-underline-offset: 2px;
}

/* Кликабельные элементы — номер и название */
.prc__link {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-family);
  cursor: pointer;
  text-align: left;
  color: var(--color-main-blue);
  text-decoration: underline;
  text-decoration-color: rgba(38, 75, 130, 0.3);
  text-underline-offset: 2px;
  transition: text-decoration-color var(--transition-fast);
}

.prc__link:hover {
  text-decoration-color: var(--color-main-blue);
}

/* Название */
.prc__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  line-height: 1.4;
}

/* Кнопка Контракты → */
.prc__contract--link {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0;
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  padding: 3px 10px;
  white-space: nowrap;
  color: var(--color-main-blue);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--transition-fast),
    border-color var(--transition-fast);
}

.prc__contract--link:hover {
  background: #dce8f5;
  border-color: var(--color-main-blue);
}

.prc__badge-manual {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: var(--color-pale-blue);
  border: 1px solid var(--color-gray-blue);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
}

.prc__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.prc__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Цена */
.prc__price-area {
  flex-shrink: 0;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.prc__price-row {
  display: flex;
  align-items: baseline;
}

.prc__price {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
  white-space: nowrap;
}

.prc__price-unit {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
}

.prc__price-note {
  font-size: 10px;
  color: var(--color-pale-black);
  white-space: nowrap;
}

/* Тело */
.prc__body {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.prc__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.prc__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-black);
  line-height: 1.4;
}

.prc__parties {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.prc__party {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  white-space: nowrap;
}

/* Правая панель */
.prc__right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

/* Действия */
.prc__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.prc__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-main-blue);
  background: none;
  border: 1px solid var(--color-gray-blue);
  border-radius: var(--radius-base);
  cursor: pointer;
  padding: 4px 10px;
  white-space: nowrap;
  transition: background var(--transition-fast),
    border-color var(--transition-fast);
}

.prc__action:hover {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
}

.prc__action--restore {
  color: var(--color-green);
}
.prc__action--restore:hover {
  background: #e6f5ee;
  border-color: var(--color-green);
}

.prc__action--detail {
  color: var(--color-pale-black);
}
.prc__action--detail:hover {
  background: #f5f5f5;
  border-color: var(--color-gray);
  color: var(--color-black);
}

.prc__action--ste {
  color: var(--color-main-blue);
}
.prc__action--ste:hover {
  background: var(--color-pale-blue);
  border-color: var(--color-main-blue);
}

/* Выброс */
.prc__outlier-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: #fff8ed;
  border-radius: var(--radius-sm);
}

.prc__outlier-text {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: #7a4400;
  line-height: 1.4;
  flex-shrink: 0;
}

.prc__outlier-include {
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: #c27000;
  background: #fff0cc;
  border: 1px solid #f5c96a;
  border-radius: var(--radius-base);
  padding: 3px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast),
    border-color var(--transition-fast);
}

.prc__outlier-include:hover {
  background: #ffe5a0;
  border-color: #e6a800;
}

.prc__outlier-include--active {
  color: #0d9b68;
  background: #e6f5ee;
  border-color: #0d9b68;
}

.prc__outlier-include--active:hover {
  background: #cceedd;
  border-color: #0a7a52;
}

@media (max-width: 768px) {
  .prc__row {
    flex-direction: column;
    align-items: flex-start;
  }
  .prc__right {
    align-items: flex-start;
  }
  .prc__actions {
    justify-content: flex-start;
  }
}
</style>
