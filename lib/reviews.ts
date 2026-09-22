export interface Review {
  username: string;
  rating: number; // 1–5
  text: string;
  date: string; // "2026-01"
}

/**
 * Отзывы публикуются вручную после модерации в Telegram — просто
 * добавляй сюда новые объекты, когда решишь опубликовать отзыв.
 */
export const REVIEWS: Review[] = [];

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
