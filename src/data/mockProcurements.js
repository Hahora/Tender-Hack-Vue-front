// Словарь регионов России (все субъекты РФ)
export const REGIONS = [
  "Республика Адыгея",
  "Республика Алтай",
  "Республика Башкортостан",
  "Республика Бурятия",
  "Республика Дагестан",
  "Республика Ингушетия",
  "Кабардино-Балкарская Республика",
  "Республика Калмыкия",
  "Карачаево-Черкесская Республика",
  "Республика Карелия",
  "Республика Коми",
  "Республика Крым",
  "Республика Марий Эл",
  "Республика Мордовия",
  "Республика Саха (Якутия)",
  "Республика Северная Осетия — Алания",
  "Республика Татарстан",
  "Республика Тыва",
  "Удмуртская Республика",
  "Республика Хакасия",
  "Чеченская Республика",
  "Чувашская Республика",
  "Алтайский край",
  "Забайкальский край",
  "Камчатский край",
  "Краснодарский край",
  "Красноярский край",
  "Пермский край",
  "Приморский край",
  "Ставропольский край",
  "Хабаровский край",
  "Амурская область",
  "Архангельская область",
  "Астраханская область",
  "Белгородская область",
  "Брянская область",
  "Владимирская область",
  "Волгоградская область",
  "Вологодская область",
  "Воронежская область",
  "Ивановская область",
  "Иркутская область",
  "Калининградская область",
  "Калужская область",
  "Кемеровская область",
  "Кировская область",
  "Костромская область",
  "Курганская область",
  "Курская область",
  "Ленинградская область",
  "Липецкая область",
  "Магаданская область",
  "Московская область",
  "Мурманская область",
  "Нижегородская область",
  "Новгородская область",
  "Новосибирская область",
  "Омская область",
  "Оренбургская область",
  "Орловская область",
  "Пензенская область",
  "Псковская область",
  "Ростовская область",
  "Рязанская область",
  "Самарская область",
  "Саратовская область",
  "Сахалинская область",
  "Свердловская область",
  "Смоленская область",
  "Тамбовская область",
  "Тверская область",
  "Томская область",
  "Тульская область",
  "Тюменская область",
  "Ульяновская область",
  "Челябинская область",
  "Ярославская область",
  "Москва",
  "Санкт-Петербург",
  "Севастополь",
  "Еврейская автономная область",
  "Ненецкий автономный округ",
  "Ханты-Мансийский автономный округ — Югра",
  "Чукотский автономный округ",
  "Ямало-Ненецкий автономный округ",
];

/**
 * Генерирует случайный элемент из массива
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Генерирует случайную дату в диапазоне последних N месяцев
 */
function randomDate(monthsBack = 24) {
  const now = new Date();
  const past = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const diff = now - past;
  return new Date(past.getTime() + Math.random() * diff)
    .toISOString()
    .split("T")[0];
}

/**
 * Генерирует случайную цену с заданным базовым значением и разбросом
 * @param {number} base   - базовая цена
 * @param {number} spread - процент разброса (0–1)
 */
function randomPrice(base, spread = 0.3) {
  const factor = 1 + (Math.random() * 2 - 1) * spread;
  return Math.round(base * factor * 100) / 100;
}

// Поставщики
const SUPPLIERS = [
  "ООО «ТехноМаркет»",
  "АО «ОфисСнаб»",
  "ИП Сидоров А.В.",
  "ООО «Промпоставка»",
  "ЗАО «КомпьюСервис»",
  "ООО «Альфа-Трейд»",
  "АО «РосОфис»",
  "ООО «МегаСнаб»",
  "ИП Кузнецова О.Н.",
  "ООО «ГосПоставщик»",
  "АО «Снабжение и Сервис»",
  "ООО «ТоргДом»",
];

// Заказчики
const CUSTOMERS = [
  "ГБОУ «Школа № 554»",
  "ФГБУ «Городская больница № 1»",
  "МКУ «Управление образования»",
  "МАУК «Городской дворец культуры»",
  "ФКУ «Центр занятости населения»",
  "ГБУЗ «Детская поликлиника № 3»",
  "МБУ «Спортивный комплекс»",
  "ФГБОУ ВО «Государственный университет»",
];

/**
 * Каталог СТЕ с базовыми ценами за единицу
 * Используется для генерации реалистичных тестовых данных
 */
export const STE_CATALOG = [
  {
    id: "СТЕ-100001",
    name: "Бумага офисная А4",
    category: "Канцелярские товары",
    manufacturer: "SVETOCOPY",
    characteristics: "А4, 80 г/м², 500 листов",
    unit: "пачка",
    basePrice: 420,
  },
  {
    id: "СТЕ-100002",
    name: "Ручка шариковая синяя",
    category: "Канцелярские товары",
    manufacturer: "Brauberg",
    characteristics: "Синяя, 0,5 мм, масляная",
    unit: "шт",
    basePrice: 18,
  },
  {
    id: "СТЕ-100003",
    name: "Принтер лазерный",
    category: "Оргтехника",
    manufacturer: "HP",
    characteristics: "A4, ч/б, 22 стр/мин, USB",
    unit: "шт",
    basePrice: 12500,
  },
  {
    id: "СТЕ-100004",
    name: "Картридж для принтера HP",
    category: "Расходные материалы",
    manufacturer: "HP",
    characteristics: "CE285A, чёрный, 1600 стр.",
    unit: "шт",
    basePrice: 2800,
  },
  {
    id: "СТЕ-100005",
    name: "Ноутбук 15,6 дюймов",
    category: "Компьютерная техника",
    manufacturer: "Lenovo",
    characteristics: "i5, 16 ГБ RAM, 512 ГБ SSD",
    unit: "шт",
    basePrice: 55000,
  },
  {
    id: "СТЕ-100006",
    name: "Монитор 24 дюйма",
    category: "Компьютерная техника",
    manufacturer: "Samsung",
    characteristics: "IPS, 1920×1080, 75 Гц, HDMI",
    unit: "шт",
    basePrice: 18000,
  },
  {
    id: "СТЕ-100007",
    name: "Стол офисный",
    category: "Мебель",
    manufacturer: "ИКЕА",
    characteristics: "1400×700 мм, МДФ, белый",
    unit: "шт",
    basePrice: 8500,
  },
  {
    id: "СТЕ-100008",
    name: "Кресло офисное",
    category: "Мебель",
    manufacturer: "CHAIRMAN",
    characteristics: "Сетка, подлокотники, чёрное",
    unit: "шт",
    basePrice: 7200,
  },
  {
    id: "СТЕ-100009",
    name: "Маркер перманентный Uni Posca",
    category: "Канцелярские товары",
    manufacturer: "Uni Mitsubishi",
    characteristics: "PC-1MR, белый, 0,7 мм",
    unit: "шт",
    basePrice: 220,
  },
  {
    id: "СТЕ-100010",
    name: "Папка архивная",
    category: "Архивные материалы",
    manufacturer: "Comix",
    characteristics: "А4, 70 мм, с завязками, серая",
    unit: "шт",
    basePrice: 85,
  },
  {
    id: "СТЕ-100011",
    name: "Флеш-накопитель 32 ГБ",
    category: "Носители информации",
    manufacturer: "Kingston",
    characteristics: "USB 3.0, 32 ГБ, до 100 МБ/с",
    unit: "шт",
    basePrice: 650,
  },
  {
    id: "СТЕ-100012",
    name: "Сканер документов",
    category: "Оргтехника",
    manufacturer: "Fujitsu",
    characteristics: "A4, 600 dpi, ADF 50 листов, USB",
    unit: "шт",
    basePrice: 22000,
  },
];

/**
 * Генерирует набор тестовых закупок для заданного СТЕ
 * @param {string} steName - название СТЕ для поиска
 * @param {number} count   - количество записей
 * @returns {Array} массив закупок
 */
export function generateMockProcurements(steName, count = 25) {
  // Ищем похожее СТЕ в каталоге
  const steEntry = STE_CATALOG.find(
    (item) =>
      item.name.toLowerCase().includes(steName.toLowerCase().trim()) ||
      steName.toLowerCase().includes(item.name.toLowerCase())
  );
  const basePrice = steEntry?.basePrice ?? 1000;
  const unit = steEntry?.unit ?? "шт";

  const procurements = [];

  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 50) + 1;
    const unitPrice = randomPrice(basePrice, 0.35);
    const region = randomItem(REGIONS);
    const date = randomDate(18); // последние 18 месяцев
    const law = Math.random() > 0.3 ? "44-ФЗ" : "223-ФЗ";

    // Реестровый номер контракта ЕИС: формат YYYY + 15 цифр
    const year = new Date(date).getFullYear();
    const contractNumber = `${year}${String(
      Math.floor(Math.random() * 1e15)
    ).padStart(15, "0")}`;

    // Ставка НДС: 20% — основная, 10% — льготная, 0% — экспорт, null — без НДС
    const vatOptions = [20, 20, 20, 10, 0, null];
    const vatRate = randomItem(vatOptions);
    // Цена с НДС (если применяется)
    const priceWithVat =
      vatRate != null
        ? Math.round(unitPrice * (1 + vatRate / 100) * 100) / 100
        : null;

    procurements.push({
      id: `PRK-${100000 + i}`,
      steNumber:
        steEntry?.id ?? `СТЕ-${Math.floor(Math.random() * 9000000) + 1000000}`,
      contractNumber,
      vatRate,
      priceWithVat,
      name: steName,
      supplier: randomItem(SUPPLIERS),
      customer: randomItem(CUSTOMERS),
      region,
      unitPrice,
      quantity,
      totalPrice: Math.round(unitPrice * quantity * 100) / 100,
      unit,
      date,
      law,
      // признак выброса (проставляется при расчёте)
      isOutlier: false,
      // пользователь исключил вручную
      isExcluded: false,
    });
  }

  // Добавляем несколько «выбросов» для демонстрации очистки
  const outlierCount = Math.floor(count * 0.1);
  for (let i = 0; i < outlierCount; i++) {
    const idx = Math.floor(Math.random() * count);
    procurements[idx].unitPrice = randomPrice(basePrice, 1.5);
    procurements[idx].totalPrice =
      Math.round(
        procurements[idx].unitPrice * procurements[idx].quantity * 100
      ) / 100;
  }

  // Сортировка по дате — сначала новые
  procurements.sort((a, b) => new Date(b.date) - new Date(a.date));

  return procurements;
}

/**
 * Подсказки для автодополнения при поиске СТЕ
 */
export const STE_SUGGESTIONS = STE_CATALOG.map((item) => item.name);
