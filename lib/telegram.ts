// parse_mode=HTML: без экранирования Telegram отклоняет сообщение с <, > или &.
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface BotConfig {
  token?: string;
  chatId?: string;
}

// По умолчанию — основной бот заявок.
const MAIN_BOT: BotConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID
};

// Отдельный бот для карточек вещей из админки. Чат по умолчанию тот же
// (ваш личный id), достаточно нажать /start в новом боте.
export const ITEM_BOT: BotConfig = {
  token: process.env.ITEM_BOT_TOKEN,
  chatId: process.env.ITEM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID
};

export async function sendTelegramMessage(
  text: string,
  bot: BotConfig = MAIN_BOT,
  disablePreview = false
): Promise<boolean> {
  if (!bot.token || !bot.chatId) {
    console.error("Токен или chat_id Telegram-бота не заданы в переменных окружения");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${bot.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: bot.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: disablePreview
      })
    });
    return res.ok;
  } catch (e) {
    console.error("Ошибка отправки в Telegram:", e);
    return false;
  }
}

export async function sendTelegramPhoto(
  photo: Blob,
  filename: string,
  caption: string,
  bot: BotConfig = MAIN_BOT,
  button?: { text: string; url: string }
): Promise<boolean> {
  return (await sendPhotoResult(photo, filename, caption, bot, button)) === null;
}

// null — отправлено, иначе текст ошибки от Telegram (для диагностики).
export async function sendPhotoResult(
  photo: Blob,
  filename: string,
  caption: string,
  bot: BotConfig,
  button?: { text: string; url: string }
): Promise<string | null> {
  if (!bot.token || !bot.chatId) {
    console.error("Токен или chat_id Telegram-бота не заданы в переменных окружения");
    return "токен или chat_id не заданы";
  }

  try {
    const form = new FormData();
    form.append("chat_id", bot.chatId);
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    form.append("photo", photo, filename);
    // Кнопка-ссылка под фото; при пересылке в канал она сохраняется.
    if (button) form.append("reply_markup", JSON.stringify({ inline_keyboard: [[button]] }));

    const res = await fetch(`https://api.telegram.org/bot${bot.token}/sendPhoto`, {
      method: "POST",
      body: form
    });
    if (res.ok) return null;
    const err = String((await res.json().catch(() => null))?.description ?? `HTTP ${res.status}`);
    console.error("Telegram sendPhoto:", err);
    return err;
  } catch (e) {
    console.error("Ошибка отправки фото в Telegram:", e);
    return "сеть недоступна";
  }
}

// Отдельный бот для объявлений «В наличии»: присылает готовый пост для канала.
export const LISTING_BOT: BotConfig = {
  token: process.env.LISTING_BOT_TOKEN,
  chatId: process.env.LISTING_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID
};

// Канал для вещей «под заказ» (по умолчанию @yenwayjapan). Публикует любой
// из ботов, который назначен администратором канала с правом публикации.
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID ?? "@yenwayjapan";
export const CHANNEL_TOKENS = Array.from(
  new Set([process.env.LISTING_BOT_TOKEN, process.env.ITEM_BOT_TOKEN, process.env.TELEGRAM_BOT_TOKEN])
).filter((t): t is string => !!t);
