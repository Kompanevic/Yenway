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
