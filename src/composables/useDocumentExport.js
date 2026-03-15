import { ref } from "vue";
import { formatPrice, formatDate } from "./usePriceCalculation.js";

export function useDocumentExport() {
  // Версия документа (увеличивается при каждом пересчёте)
  const version = ref(1);

  // Дата последнего сохранения
  const savedAt = ref(null);

  /**
   * Скачивает текст как .txt-файл
   * @param {string} text     - содержимое файла
   * @param {string} filename - имя файла
   */
  function downloadText(text, filename) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Формирует полный текст документа обоснования НМЦ
   */
  function buildDocument({
    steQuery,
    requestedQty,
    unit,
    justificationText,
    validProcurements,
    totalNmts,
  }) {
    const now = new Date();
    const dateStr = formatDate(now.toISOString().split("T")[0]);
    const lines = [
      "═".repeat(60),
      `ОБОСНОВАНИЕ НАЧАЛЬНОЙ (МАКСИМАЛЬНОЙ) ЦЕНЫ КОНТРАКТА`,
      `Версия документа: ${version.value}`,
      `Дата формирования: ${dateStr}`,
      "═".repeat(60),
      "",
      `Наименование объекта закупки: ${steQuery}`,
      `Требуемое количество: ${requestedQty} ${unit}`,
      "",
      justificationText,
      "",
      "─".repeat(60),
      "ИСПОЛЬЗОВАННЫЕ ЗАКУПКИ:",
      "─".repeat(60),
    ];

    validProcurements.forEach((p, i) => {
      lines.push(
        `${i + 1}. ${p.name}`,
        `   Поставщик:  ${p.supplier}`,
        `   Регион:     ${p.region}`,
        `   Цена/ед.:   ${formatPrice(p.unitPrice)}`,
        `   Количество: ${p.quantity} ${p.unit}`,
        `   Дата:       ${formatDate(p.date)}`,
        `   Закон:      ${p.law}`,
        ""
      );
    });

    lines.push(
      "═".repeat(60),
      `ИТОГОВАЯ НМЦ: ${formatPrice(totalNmts)}`,
      "═".repeat(60)
    );

    return lines.join("\n");
  }

  /**
   * Сохраняет (скачивает) документ и увеличивает версию
   */
  function saveDocument(params) {
    const text = buildDocument(params);
    const safeName = params.steQuery
      .replace(/[^а-яА-Яa-zA-Z0-9]/g, "_")
      .slice(0, 40);
    const filename = `НМЦ_${safeName}_v${version.value}.txt`;
    downloadText(text, filename);
    savedAt.value = new Date();
    version.value++;
  }

  /**
   * Пересчитывает и сохраняет новую версию документа
   */
  function recalculateAndSave(params) {
    saveDocument(params);
  }

  return {
    version,
    savedAt,
    saveDocument,
    recalculateAndSave,
    buildDocument,
  };
}
