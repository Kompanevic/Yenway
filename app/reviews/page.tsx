import ReviewForm from "@/components/ReviewForm";
import GlassIcons from "@/components/GlassIcons";
import { REVIEWS, averageRating } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="text-accent text-lg leading-none">
      {"★".repeat(rating)}
      <span className="text-white/20">{"★".repeat(5 - rating)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const avg = averageRating(REVIEWS);

  return (
    <main className="relative overflow-hidden">
      <GlassIcons />
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
          ← на главную
        </a>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 tracking-tight">
          Отзывы
        </h1>
        <p className="text-white/50 mt-3 text-lg max-w-2xl">
          Что говорят те, кто уже заказывал через YenWay.
        </p>

        {REVIEWS.length > 0 && (
          <div className="mt-6 flex items-center gap-3">
            <span className="font-display text-3xl font-bold">{avg.toFixed(1)}</span>
            <Stars rating={Math.round(avg)} />
            <span className="text-white/40 text-sm">
              · {REVIEWS.length} {REVIEWS.length === 1 ? "отзыв" : "отзывов"}
            </span>
          </div>
        )}

        <div className="mt-12 grid lg:grid-cols-[1.1fr,0.9fr] gap-14">
          <div>
            {REVIEWS.length === 0 ? (
              <div className="rounded-3xl bg-panel/80 backdrop-blur-sm border border-line p-10 text-center">
                <p className="text-white/50">
                  Пока нет опубликованных отзывов — будьте первым, кто оставит свой!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {REVIEWS.map((r, i) => (
                  <div key={i} className="rounded-2xl bg-panel/80 backdrop-blur-sm border border-line p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold">@{r.username}</span>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="mt-3 text-sm text-white/60">{r.text}</p>
                    <div className="mt-3 text-xs text-white/30">{r.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ReviewForm />
        </div>
      </div>
    </main>
  );
}
