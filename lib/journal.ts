export interface JournalPost {
  url: string;
  brand?: string; // подпись над заголовком; если не задано — возьмём имя сайта
}

/**
 * Добавляй сюда ссылки на статьи/показы — карточка (фото + заголовок)
 * подтянется сама с сайта-источника при заходе на страницу. Полный текст
 * не копируем — карточка ведёт на оригинал по клику.
 *
 * Голые лендинги брендов (rickowens.eu, vetements.com) часто не отдают
 * og:image — лучше ссылаться на конкретные статьи/материалы, у них теги
 * почти всегда в порядке.
 */
export const JOURNAL_POSTS: JournalPost[] = [
  {
    url: "https://hypebeast.com/2025/10/rick-owens-spring-summer-2026-paris-fashion-week-womenswear-runway",
    brand: "Rick Owens"
  },
  {
    url: "https://hypebeast.com/2025/10/vetements-spring-summer-2026-menswear-womenswear-paris-fashion-week-runway",
    brand: "Vetements"
  },
  { url: "https://wwd.com/runway/spring-2026/paris/balenciaga/review/", brand: "Balenciaga" },
  { url: "https://wwd.com/runway/fall-couture-2026/paris/balenciaga/review/", brand: "Balenciaga" },
  { url: "https://www.highsnobiety.com/p/rick-owens-adidas-2026/", brand: "Rick Owens" },
  { url: "https://www.farfetch.com/stories/fashion-feed/the-farfetch-index", brand: "Farfetch" }
];
