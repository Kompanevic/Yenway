import type { Metadata } from "next";
import { MANAGER_TELEGRAM } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — YenWay",
  description: "Какие данные собирает YenWay, как использует cookie и как отозвать согласие."
};

const h2 = "font-display text-xl font-bold mt-10 mb-3";
const p = "text-white/65 leading-relaxed";

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 pt-12 pb-28">
      <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
        ← на главную
      </a>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-5 tracking-tight">Политика конфиденциальности</h1>
      <p className={`${p} mt-4`}>
        Здесь описано, какие данные собирает сайт YenWay и Telegram-приложение YenWay, зачем они нужны и как от этого отказаться.
      </p>

      <h2 className={h2}>Какие данные мы получаем</h2>
      <ul className={`${p} list-disc pl-5 space-y-2`}>
        <li>Ник в Telegram, ссылки на товары и другие данные, которые вы сами указываете в заявках, расчётах, отзывах и объявлениях.</li>
        <li>В Telegram-приложении — данные профиля, которые передаёт Telegram: id, имя, ник и аватар.</li>
        <li>Технические данные: IP-адрес и сведения о браузере — для защиты от злоупотреблений и, с вашего согласия, для статистики посещений.</li>
      </ul>

      <h2 className={h2}>Зачем</h2>
      <p className={p}>
        Чтобы рассчитать стоимость, оформить и выполнить заказ, связаться с вами в Telegram, показать статус заявок, а также чтобы сайт работал стабильно и
        безопасно.
      </p>

      <h2 className={h2}>Cookie и локальное хранилище</h2>
      <ul className={`${p} list-disc pl-5 space-y-2`}>
        <li>
          <b className="text-white/80">Необходимые</b> — работают всегда: вход в админ-панель, избранное и корзина, запоминание вашего выбора о cookie. Без них
          сайт не работает как надо.
        </li>
        <li>
          <b className="text-white/80">Статистика</b> — только после нажатия «Принять»: анонимный подсчёт посещений и просмотров страниц (Vercel Analytics). По
          ним нельзя определить конкретного человека.
        </li>
      </ul>

      <h2 className={h2}>Кому передаются данные</h2>
      <p className={p}>
        Данные не продаются. Для работы сайта используются сервисы хостинга и хранения (Vercel, Upstash) и Telegram — через них проходят заявки и уведомления.
      </p>

      <h2 className={h2}>Как отозвать согласие или удалить данные</h2>
      <p className={p}>
        Чтобы снова выбрать настройки cookie, очистите данные сайта в браузере — при следующем заходе мы спросим ещё раз. Чтобы удалить ваши заявки и другие
        данные, напишите менеджеру в Telegram{" "}
        <a href={`https://t.me/${MANAGER_TELEGRAM}`} className="text-white underline underline-offset-2">
          @{MANAGER_TELEGRAM}
        </a>
        .
      </p>
    </main>
  );
}
