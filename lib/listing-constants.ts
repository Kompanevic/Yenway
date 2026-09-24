export const MAX_LISTING_PHOTOS = 6;
export const LISTING_CONDITIONS = [
  "Новое с биркой",
  "Новое без бирки",
  "Отличное",
  "Хорошее",
  "Есть следы носки"
];

export type ListingKind = "stock" | "preorder";
export const LISTING_PATH: Record<ListingKind, string> = { stock: "/stock", preorder: "/preorder" };
// Старые объявления без поля kind — «в наличии».
export const kindOf = (l: { kind?: ListingKind }): ListingKind => l.kind ?? "stock";
