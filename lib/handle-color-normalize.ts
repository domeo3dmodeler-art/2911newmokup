/**
 * Нормализация названий цветов ручек для фильтра.
 * Варианты вроде ХРОМ-МАТ, ХРОМ+МАТ, хром/мат, хром мат и т.д. приводятся к одному названию «Хром».
 *
 * Получившиеся нормализованные цвета (label для UI):
 * - Хром (хром-мат, хром+мат, хром мат, хроммат, хром/мат, xpom-mat и т.п.)
 * - Белый (белый, белая)
 * - Черный (черный, черная)
 * - Графит (графит без «браш»)
 * - Графит браш (графит браш, графит браш)
 * - Никель (никель)
 * - Сатиновый никель (мат. сатиновый никель, мат сатиновый никель, сатиновый никель)
 * - Золото (золото, золотой)
 * - Латунь (латунь)
 *
 * Не удалось нормализовать (остаются как в названии, с капитализацией):
 * - Любые варианты, для которых нет правила выше — отображаются как есть.
 * - Например: «Разное графит», «Хром глянцевый» (если появятся) — можно добавить в ALIASES.
 */

export interface NormalizedColor {
  key: string;
  label: string;
  normalized: boolean;
}

/** Нормализованная строка для сравнения: нижний регистр, без лишних символов, пробелы по одному */
function normalizeRaw(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-+/\.,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Правила: порядок важен (сначала более специфичные). pattern — regex или строка (includes). */
const ALIASES: Array<{ pattern: RegExp | ((n: string) => boolean); key: string; label: string }> = [
  // Хром (все варианты хром-мат, хром мат, xpom, catxpom, матхром и т.д.; не трогаем «черный никель»)
  { pattern: (n) => /хром|xpom|chrome|catxpom|матхром|мат\s*хром/i.test(n) && !/черный\s*никель|белый\s*черный\s*никель/i.test(n), key: 'хром', label: 'Хром' },
  // Сатиновый никель (до никеля; сатникель, мат. сатиновый, разное мат никель, сатинмат)
  { pattern: (n) => /сатиновый\s*никель|мат\.?\s*сатиновый|никель\s*сатин|сатникель|мат\.?\s*сатникель|разное\s*мат\.?\s*никель|сатинмат|белый\s*черный\s*никель/i.test(n) || n === 'мат сатиновый никель', key: 'сатиновый никель', label: 'Сатиновый никель' },
  // Мат. сатиновое золото -> Золото
  { pattern: (n) => /мат\.?\s*сатиновое\s*золото/i.test(n), key: 'золото', label: 'Золото' },
  // Мат. никель (без «сатиновый») -> Никель
  { pattern: (n) => /^мат\.?\s*никель$/i.test(n) || n === 'мат никель', key: 'никель', label: 'Никель' },
  // Один «мат» (остаток после разделителей) -> Хром
  { pattern: (n) => n === 'мат', key: 'хром', label: 'Хром' },
  // Графит браш
  { pattern: /графит\s*браш|браш\s*графит/i, key: 'графит браш', label: 'Графит браш' },
  // Графит (просто; «разное графит», «черный графит»)
  { pattern: (n) => /^графит$|разное\s*графит|черный\s*графит/i.test(n), key: 'графит', label: 'Графит' },
  // Белый / белая / бел
  { pattern: /^бел(ый|ая|ые|)?$/i, key: 'белый', label: 'Белый' },
  // Черный / черная / черн
  { pattern: /^черн(ый|ая|ые|)?$/i, key: 'черный', label: 'Черный' },
  // никель черн -> черный
  { pattern: (n) => /^никель\s*черн$/i.test(n), key: 'черный', label: 'Черный' },
  // Никель (просто; темный никель, никель мат)
  { pattern: (n) => /^никель$/i.test(n) || /тем\.?\s*никель|никель\s*мат|матовый\s*никель/i.test(n), key: 'никель', label: 'Никель' },
  // Золото (золотомат, золото мат, матовое золото)
  { pattern: (n) => /^золот(о|ой|ая|омат)?$/i.test(n) || /золото\s*мат|матовое\s*золото|мат\.?\s*золото/i.test(n), key: 'золото', label: 'Золото' },
  // Латунь
  { pattern: /^латунь$/i, key: 'латунь', label: 'Латунь' },
  // Бронза
  { pattern: /^бронза$/i, key: 'бронза', label: 'Бронза' },
  // Кофе (разное кофе)
  { pattern: /^кофе$|разное\s*кофе/i, key: 'кофе', label: 'Кофе' },
  // Шампань
  { pattern: /^шампань$/i, key: 'шампань', label: 'Шампань' },
];

export function normalizeHandleColor(raw: string): NormalizedColor {
  const n = normalizeRaw(raw);
  if (!n) return { key: raw.toLowerCase(), label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : raw, normalized: false };

  for (const rule of ALIASES) {
    const match = typeof rule.pattern === 'function'
      ? rule.pattern(n)
      : (rule.pattern as RegExp).test(n);
    if (match) return { key: rule.key, label: rule.label, normalized: true };
  }

  // Не удалось нормализовать — оставляем как есть (с капитализацией)
  const key = n;
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return { key, label, normalized: false };
}

/** Из названия ручки извлекается часть «цвет» (после последнего _ или -, что дальше) и нормализуется */
export function parseAndNormalizeColor(handleName: string): NormalizedColor {
  const raw = extractColorPartFromName(handleName);
  return normalizeHandleColor(raw);
}

/** Из полного названия (например из Excel) извлекается подстрока с цветом: после последнего _ или последнего - */
export function extractColorPartFromName(fullName: string): string {
  const s = (fullName || '').trim();
  const iUnd = s.lastIndexOf('_');
  const iDash = s.lastIndexOf('-');
  const idx = iUnd >= 0 || iDash >= 0 ? Math.max(iUnd, iDash) : -1;
  if (idx >= 0 && idx < s.length - 1) return s.slice(idx + 1).trim();
  return s;
}
