// Общие константы легит-чека (можно импортировать и на клиенте).
export const LEGIT_FEE_RUB = 100;
export const LEGIT_MIN_PHOTOS = 7;
export const LEGIT_MAX_PHOTOS = 12;
export const VERDICT_MAX_PHOTOS = 6;
// Фото ужимаются в браузере; лимит с запасом (тело запроса на Vercel ≤ 4.5 МБ).
export const LEGIT_MAX_PHOTO_BYTES = 800 * 1024;

export type VerdictKind = "legit" | "fake";
export const VERDICT_LABEL: Record<VerdictKind, string> = { legit: "LEGIT", fake: "FAKE" };

// Что снять, чтобы проверка была точной.
export const LEGIT_ANGLES = [
  "Патч вблизи",
  "Пара со всех сторон",
  "Подошва",
  "Стельки с двух сторон",
  "Дно ботинка без стельки",
  "Носы сверху",
  "Логотип на чипе (при наличии)",
  "Сайзтег"
];
