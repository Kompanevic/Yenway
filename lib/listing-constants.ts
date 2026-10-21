export const MAX_LISTING_PHOTOS = 6;
export const LISTING_CONDITIONS = [
  "Новое с биркой",
  "Новое без бирки",
  "Отличное",
  "Хорошее",
  "Есть следы носки"
];

// bought — «Выкупленные»: витрина вещей, которые мы уже выкупили клиентам.
// Тип вещи — для фильтров в ленте.
export const LISTING_CATEGORIES = [
  "Футболки",
  "Лонгсливы",
  "Худи",
  "Свитшоты",
  "Свитеры",
  "Рубашки",
  "Куртки",
  "Пальто",
  "Штаны",
  "Джинсы",
  "Шорты",
  "Обувь",
  "Сумки",
  "Аксессуары",
  "Другое"
];

export type ListingKind = "stock" | "preorder" | "bought";
export const LISTING_PATH: Record<ListingKind, string> = { stock: "/stock", preorder: "/preorder", bought: "/bought" };
// Старые объявления без поля kind — «в наличии».
export const kindOf = (l: { kind?: ListingKind }): ListingKind => l.kind ?? "stock";

// Подсказка типа по названию (англ., рус., яп. с Mercari). Порядок важен:
// более точные слова раньше (t-shirt раньше shirt, hoodie раньше sweat).
const CATEGORY_HINTS: [string, RegExp][] = [
  ["Обувь", /geobasket|ramones|abstract|bozo|tractor|creeper|jumbo lace|sneaker|кроссов|кед|boot|ботин|сапог|loafer|лофер|sandal|сандал|slide|derby|dunk|jordan|yeezy|tabi|vans|converse|new balance|asics|shoe|обув|スニーカー|ブーツ|シューズ|靴|サンダル|ローファー/i],
  ["Худи", /hood|худи|толстовк.*капюш|パーカー|フーディ/i],
  ["Футболки", /(^|[^a-z])t-?shirt|\btee\b|футболк|Tシャツ|ティーシャツ/i],
  ["Лонгсливы", /long ?sleeve|лонгслив|ロンT|ロングスリーブ|長袖/i],
  ["Свитшоты", /sweat ?shirt|crewneck|свитшот|スウェット|トレーナー/i],
  ["Свитеры", /sweater|knit|cardigan|свитер|джемпер|кардиган|ニット|セーター|カーディガン/i],
  ["Пальто", /coat|пальто|тренч|コート/i],
  ["Куртки", /jacket|bomber|parka|puffer|blouson|куртк|бомбер|пуховик|ветровк|ジャケット|ブルゾン|ダウン/i],
  ["Джинсы", /jeans|denim|джинс|デニム|ジーンズ/i],
  ["Шорты", /shorts|шорт|ショーツ|ショートパンツ|ハーフパンツ/i],
  ["Штаны", /pants|trousers|cargo|jogger|брюк|штан|карго|パンツ|スラックス|ズボン/i],
  ["Рубашки", /shirt|рубаш|シャツ|ブラウス/i],
  ["Сумки", /bag|backpack|tote|сумк|рюкзак|шоппер|バッグ|リュック|トート/i],
  ["Аксессуары", /belt|ремень|cap\b|кепк|шапк|beanie|hat|scarf|шарф|ring|кольц|necklace|цепоч|wallet|кошел|бумажник|glasses|очки|ベルト|キャップ|帽子|ネックレス|リング|財布|マフラー/i]
];

export function guessCategory(title: string): string | undefined {
  return CATEGORY_HINTS.find(([, re]) => re.test(title))?.[0];
}

// Размеры для фильтров. «Один размер» (OS, free size, フリー…) подходит под
// любой выбранный размер.
const ONE_SIZE = /^(o\/?s|one ?size|free( ?size)?|f|onesize|フリー(サイズ)?|ワンサイズ|единый( размер)?|универсальный)$/i;
const LETTER_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function isOneSize(size: string): boolean {
  return ONE_SIZE.test(size.trim());
}

// Приводим размер к одному виду: «42 EU» → «42», «m» → «M», «27,5 см» → «27.5».
export function sizeKey(size: string): string {
  const s = size.trim().toUpperCase().replace(",", ".").replace(/\s*(EU|EUR|RU|US|UK|JP|CM|СМ|РАЗМЕР|SIZE)\s*/g, " ").trim();
  return s.replace(/\s+/g, " ");
}

export function compareSizes(a: string, b: string): number {
  const la = LETTER_ORDER.indexOf(a), lb = LETTER_ORDER.indexOf(b);
  if (la !== -1 || lb !== -1) return (la === -1 ? 99 : la) - (lb === -1 ? 99 : lb);
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  if (!Number.isNaN(na)) return -1;
  if (!Number.isNaN(nb)) return 1;
  return a.localeCompare(b);
}
