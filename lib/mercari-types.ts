// Типы вещей → как их ищут на Mercari (по-японски находится больше).
export const MERCARI_TYPES: Record<string, string> = {
  Футболки: "Tシャツ",
  Лонгсливы: "ロンT",
  Худи: "パーカー",
  Свитшоты: "スウェット",
  Свитеры: "ニット",
  Рубашки: "シャツ",
  Куртки: "ジャケット",
  Пальто: "コート",
  Штаны: "パンツ",
  Джинсы: "デニム",
  Шорты: "ショートパンツ",
  Обувь: "スニーカー",
  Ботинки: "ブーツ",
  Сумки: "バッグ",
  Аксессуары: "アクセサリー"
};

// Обувь ищем по размеру в сантиметрах, остальное — по буквенным размерам.
export const SHOE_TYPES = ["Обувь", "Ботинки"];
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const SHOE_SIZES = ["24", "24.5", "25", "25.5", "26", "26.5", "27", "27.5", "28", "28.5", "29", "29.5", "30"];

// Размер с Mercari → в общем виде: «XL(LL)» → «XL», «2XL(3L)» → «XXL», «26.5cm» → «26.5».
// null — размера нет; "free" — свободный размер, подходит под любой фильтр.
export function normalizeSize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  if (/FREE|フリー|ONE ?SIZE|^OS$/.test(s)) return "free";
  const cm = s.match(/(\d{2}(?:\.\d)?)\s*CM/);
  if (cm) return String(parseFloat(cm[1]));
  const head = s.split("(")[0].trim();
  if (/^(2XL|XXL|3L)$/.test(head)) return "XXL";
  if (/^(XS|SS)$/.test(head)) return "XS";
  if (/^(XL|LL)$/.test(head)) return "XL";
  if (/^[SML]$/.test(head)) return head;
  return null;
}
