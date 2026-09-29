import LegitForm from "@/components/LegitForm";
import VerdictGrid from "@/components/VerdictGrid";
import { getVerdicts } from "@/lib/legit-store";
import { LEGIT_FEE_RUB } from "@/lib/legit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Легит-чек Rick Owens — YenWay",
  description: `Проверим подлинность обуви Rick Owens по фото за ${LEGIT_FEE_RUB} ₽.`
};

export default async function LegitPage() {
  const verdicts = (await getVerdicts().catch(() => [])).map((v) => ({
    id: v.id,
    title: v.title,
    verdict: v.verdict,
    note: v.note,
    photoCount: v.photoCount,
    date: new Date(v.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
  }));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-20">
      <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Легит-чек Rick Owens</h1>
      <p className="text-white/50 mt-3 text-lg max-w-2xl">
        Сомневаетесь в оригинальности обуви Rick Owens? Пришлите фото со всех сторон — проверим и дадим вердикт в
        Telegram. Стоимость — {LEGIT_FEE_RUB} ₽.
      </p>

      <div className="mt-10 max-w-2xl">
        <LegitForm />
      </div>

      <section className="mt-20">
        <h2 className="font-display text-2xl sm:text-4xl font-bold">Вердикты</h2>
        <p className="mt-2 text-white/50">Последние проверки: нажмите на фото, чтобы посмотреть подробнее.</p>
        <VerdictGrid items={verdicts} />
      </section>
    </main>
  );
}
