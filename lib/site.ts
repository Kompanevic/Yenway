// Боевой адрес сайта для ссылок в Telegram-постах и метаданных. На Vercel
// берётся домен продакшена (сам сменится, если подключить свой домен),
// а не адрес превью-деплоя, который может быть закрыт авторизацией.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://yenway.vercel.app";
