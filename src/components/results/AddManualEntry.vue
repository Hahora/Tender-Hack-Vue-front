<script setup>
import { ref, reactive } from "vue";
import AppInput from "../ui/AppInput.vue";
import AppSelect from "../ui/AppSelect.vue";
import AppButton from "../ui/AppButton.vue";
import { REGIONS } from "../../data/mockProcurements.js";

const emit = defineEmits(["add", "cancel"]);

// Поля формы
const form = reactive({
  unitPrice: "",
  quantity: 1,
  supplier: "",
  region: "",
  date: new Date().toISOString().split("T")[0],
  unit: "шт",
});

// Ошибки валидации
const errors = reactive({ unitPrice: "", quantity: "" });

const UNIT_OPTIONS = ["шт", "кг", "л", "м", "упак", "компл", "пачка", "рул"];

function validate() {
  errors.unitPrice = "";
  errors.quantity = "";
  let ok = true;

  const price = parseFloat(String(form.unitPrice).replace(",", "."));
  if (!form.unitPrice || isNaN(price) || price <= 0) {
    errors.unitPrice = "Введите корректную цену больше нуля";
    ok = false;
  }

  const qty = parseInt(form.quantity);
  if (!qty || qty < 1) {
    errors.quantity = "Количество должно быть не менее 1";
    ok = false;
  }

  return ok;
}

function submit() {
  if (!validate()) return;
  emit("add", {
    unitPrice: parseFloat(String(form.unitPrice).replace(",", ".")),
    quantity: parseInt(form.quantity),
    supplier: form.supplier || "—",
    region: form.region,
    date: form.date,
    unit: form.unit,
  });

  // Сброс формы
  form.unitPrice = "";
  form.quantity = 1;
  form.supplier = "";
  form.region = "";
  form.date = new Date().toISOString().split("T")[0];
}
</script>

<template>
  <div class="add-entry">
    <h4 class="add-entry__title">Добавить позицию вручную</h4>
    <p class="add-entry__hint">
      Используйте, если не удалось найти аналоги в ЕИС или нужно добавить
      прайс-лист поставщика
    </p>

    <div class="add-entry__grid">
      <!-- Цена за единицу -->
      <AppInput
        v-model="form.unitPrice"
        type="number"
        label="Цена за единицу, ₽"
        placeholder="0.00"
        :error="errors.unitPrice"
        required
      />

      <!-- Количество -->
      <AppInput
        v-model="form.quantity"
        type="number"
        label="Количество"
        placeholder="1"
        :error="errors.quantity"
        required
      />

      <!-- Единица измерения -->
      <AppSelect v-model="form.unit" label="Единица" :options="UNIT_OPTIONS" />

      <!-- Поставщик -->
      <AppInput
        v-model="form.supplier"
        label="Поставщик"
        placeholder="Название компании"
      />

      <!-- Регион -->
      <AppSelect
        v-model="form.region"
        label="Регион"
        placeholder="Выберите регион"
        :options="REGIONS"
      />

      <!-- Дата -->
      <AppInput v-model="form.date" type="date" label="Дата" />
    </div>

    <!-- Кнопки -->
    <div class="add-entry__actions">
      <AppButton variant="primary" size="md" @click="submit">
        Добавить в расчёт
      </AppButton>
      <AppButton variant="ghost" size="md" @click="$emit('cancel')">
        Отмена
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.add-entry {
  background-color: var(--color-bg-card);
  border: 2px dashed var(--color-main-blue);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.add-entry__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-black);
}

.add-entry__hint {
  font-size: var(--font-size-sm);
  color: var(--color-pale-black);
  line-height: 1.5;
}

.add-entry__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.add-entry__actions {
  display: flex;
  gap: var(--space-3);
}
</style>
