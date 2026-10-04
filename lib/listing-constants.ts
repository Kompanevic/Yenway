export const MAX_LISTING_PHOTOS = 6;
export const LISTING_CONDITIONS = [
  "Новое с биркой",
  "Новое без бирки",
  "Отличное",
  "Хорошее",
  "Есть следы носки"
];

// bought — «Выкупленные»: витрина вещей, которые мы уже выкупили клиентам.
export type ListingKind = "stock" | "preorder" | "bought";
export const LISTING_PATH: Record<ListingKind, string> = { stock: "/stock", preorder: "/preorder", bought: "/bought" };
// Старые объявления без поля kind — «в наличии».
export const kindOf = (l: { kind?: ListingKind }): ListingKind => l.kind ?? "stock";
