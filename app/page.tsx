import Link from "next/link";
import { REGION_LIST } from "@/lib/regions";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6">
      <header className="flex items-center justify-between py-8">
        <div className="text-2xl font-bold tracking-tight">
          Yen<span className="text-accent">way</span>
        </div>
        <Link
          href="/order"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold hover:bg-accent2 transition-colors"
        >
          Оформить заказ
        </Link>
      </header>

      <section className="py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
          Закажем вещь с любой зарубежной площадки
        </h1>
        <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
          Вставьте ссылку на товар — мы покажем фото, посчитаем стоимость с доставкой и
          страховкой, и свяжемся с вами в Telegram.
        </p>
        <Link
          href="/order"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-semibold text-lg hover:bg-accent2 transition-colors"
        >
          Вставить ссылку на товар
        </Link>
      </section>

      <section className="py-10">
        <h2 className="text-2xl font-bold mb-6">Откуда заказываем</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REGION_LIST.map((r) => (
            <Link
              key={r.key}
              href={`/order?region=${r.key}`}
              className="group rounded-2xl bg-panel border border-white/5 p-6 hover:border-accent/50 transition-colors"
            >
              <div className="text-4xl">{r.flag}</div>
              <div className="mt-3 text-xl font-bold group-hover:text-accent transition-colors">
                {r.name}
              </div>
              <p className="mt-2 text-sm text-white/50">{r.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.platforms.map((p) => (
                  <span key={p} className="text-xs rounded-full bg-white/5 px-2 py-1 text-white/60">
                    {p}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 grid sm:grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-accent">1</div>
          <p className="mt-2 text-white/60">Вставляете ссылку на товар и ник в Telegram</p>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent">2</div>
          <p className="mt-2 text-white/60">Мы считаем стоимость с доставкой и страховкой</p>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent">3</div>
          <p className="mt-2 text-white/60">Пишем вам в Telegram и оформляем заказ</p>
        </div>
      </section>

      <footer className="py-10 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} Yenway
      </footer>
    </main>
  );
}
