import Image from "next/image";
import Link from "next/link";
import { REGION_LIST } from "@/lib/regions";

export default function Home() {
  return (
    <main>
      <header className="max-w-6xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Yenway" width={40} height={40} className="rounded-full" />
          <span className="text-xl font-bold tracking-wide">YenWay</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-white/60">
          {REGION_LIST.map((r) => (
            <Link key={r.key} href={`/order?region=${r.key}`} className="hover:text-white transition-colors">
              {r.name}
            </Link>
          ))}
        </nav>
        <Link
          href="/order"
          className="rounded-full bg-accent text-ink px-5 py-2 text-sm font-semibold hover:bg-accent2 transition-colors"
        >
          Сделать заказ
        </Link>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <video
            className="w-full h-full object-cover opacity-40"
            autoPlay
            muted
            loop
            playsInline
            poster="/logo.jpg"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-28 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            Оригинальные бренды
            <br />
            <span className="text-white/60">со всего мира</span>
          </h1>
          <p className="mt-5 text-lg text-white/50 max-w-2xl mx-auto">
            Вставьте ссылку на товар из Японии, Европы, США, Китая или Кореи — покажем фото,
            посчитаем стоимость с доставкой и страховкой.
          </p>
          <Link
            href="/order"
            className="mt-9 inline-block rounded-full bg-accent text-ink px-8 py-3 font-semibold text-lg hover:bg-accent2 transition-colors"
          >
            Сделать заказ
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
        <section className="py-10">
          <h2 className="text-2xl font-bold mb-6">Откуда заказываем</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REGION_LIST.map((r) => (
              <Link
                key={r.key}
                href={`/order?region=${r.key}`}
                className="group rounded-2xl bg-panel border border-line p-6 hover:border-accent/40 transition-colors"
              >
                <div className="text-4xl grayscale">{r.flag}</div>
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
          © {new Date().getFullYear()} YenWay
        </footer>
      </div>
    </main>
  );
}
