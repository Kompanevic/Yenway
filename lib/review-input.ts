import type { ReviewInput } from "./reviews-store";

// Сжатое в браузере фото весит ~100–300 КБ; лимит держим с запасом под
// ограничение размера запроса в Upstash (base64 раздувает на треть).
const MAX_PHOTO_BYTES = 600 * 1024;

export type ParsedReview =
  | { ok: true; value: ReviewInput; photoBlob: Blob | null }
  | { ok: false; error: string };

export async function parseReviewForm(form: FormData, minTextLength: number): Promise<ParsedReview> {
  const usernameRaw = form.get("username");
  const rating = Number(form.get("rating"));
  const textRaw = form.get("text");
  const photo = form.get("photo");

  if (typeof usernameRaw !== "string" || typeof textRaw !== "string" || !rating) {
    return { ok: false, error: "Заполните ник, оценку и текст отзыва" };
  }
  const username = usernameRaw.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return { ok: false, error: "Некорректный ник в Telegram (например: ivan_petrov)" };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Оценка должна быть от 1 до 5" };
  }
  const text = textRaw.trim().slice(0, 1000);
  if (text.length < minTextLength) {
    return { ok: false, error: "Текст отзыва слишком короткий" };
  }

  if (!(photo instanceof Blob) || photo.size === 0) {
    return { ok: true, value: { username, rating, text }, photoBlob: null };
  }
  if (!photo.type.startsWith("image/")) {
    return { ok: false, error: "Файл должен быть изображением" };
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "Фото слишком большое — попробуйте другое" };
  }
  const data = Buffer.from(await photo.arrayBuffer()).toString("base64");
  return { ok: true, value: { username, rating, text, photo: { type: photo.type, data } }, photoBlob: photo };
}
