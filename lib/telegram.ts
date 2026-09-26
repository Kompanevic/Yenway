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
  if (!bot.token || !bot.chatId) {
    console.error("Токен или chat_id Telegram-бота не заданы в переменных окружения");
    return false;
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
    return res.ok;
  } catch (e) {
    console.error("Ошибка отправки фото в Telegram:", e);
    return false;
  }
}

// Отдельный бот для объявлений «В наличии»: присылает готовый пост для канала.
export const LISTING_BOT: BotConfig = {
  token: process.env.LISTING_BOT_TOKEN,
  chatId: process.env.LISTING_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID
};
