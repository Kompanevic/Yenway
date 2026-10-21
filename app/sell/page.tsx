"use client";

import SellForm from "@/components/SellForm";
import { useMiniApp } from "@/lib/tg-webapp";

export default function SellPage() {
  const miniApp = useMiniApp();
  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 pt-8 pb-28">
      <h1 className="font-display text-3xl font-bold">Выложить вещь</h1>
      <p className="mt-2 mb-6 text-sm text-white/50">
        Вставьте ссылку на вещь, поставьте свою цену — разница с выкупом под ключ ваша.
      </p>
      {miniApp ? (
        <SellForm />
      ) : (
        <a href="https://t.me/yenwayjapan" className="inline-block font-display rounded-full btn-fx bg-accent text-ink px-7 py-3 font-semibold">
          Открыть в Telegram
        </a>
      )}
    </main>
  );
}
