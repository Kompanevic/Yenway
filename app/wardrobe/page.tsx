import WardrobeStudio from "@/components/WardrobeStudio";

const RULES: { title: string; text: string; swatches: string[]; sizes?: string[] }[] = [
  {
    title: "Нейтральная база",
    text: "Чёрный, белый, серый, бежевый, тёмно-синий — сочетаются вообще со всем.",
    swatches: ["#161617", "#e7e5e1", "#8a8a86", "#c2b8a3"]
  },
  {
    title: "Монохром",
    text: "Один цвет — от светлого к тёмному. Беспроигрышно и дорого смотрится.",
    swatches: ["#cfe0f5", "#7fa8d9", "#2f4d7a"]
  },
  {
    title: "Комплементарные",
    text: "Противоположные на цветовом круге цвета — контраст, который работает.",
    swatches: ["#3060c8", "#e08a3c"]
  },
  {
    title: "Аналоговые",
    text: "Соседние на круге оттенки — мягкое, гармоничное сочетание без спора.",
    swatches: ["#3060c8", "#6b5fc0", "#9c5fc0"]
  },
  {
    title: "Правило 60/30/10",
    text: "60% базовый цвет, 30% дополнительный, 10% яркий акцент — деталь, а не всё сразу.",
    swatches: ["#161617", "#8a8a86", "#c02020"],
    sizes: ["w-7 h-7", "w-5 h-5", "w-3 h-3"]
  },
  {
    title: "Максимум 3 цвета",
    text: "Больше трёх в одном образе — и он начинает выглядеть случайным.",
    swatches: ["#161617", "#e7e5e1", "#c2b8a3"]
  }
];

export default function WardrobePage() {
  return (
    <main className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "180vw",
            height: "42vh",
            background:
              "linear-gradient(90deg, transparent 0%, #f7c9c9 14%, #f3f0b8 32%, #c9e8c0 50%, #bfe3e0 68%, #d3c6ef 86%, transparent 100%)",
            transform: "translate(-50%, -50%) rotate(-16deg)",
            opacity: 0.4,
            filter: "blur(45px)"
          }}
        />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
          ← на главную
        </a>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 tracking-tight">
          Гардероб
        </h1>
        <p className="text-white/50 mt-3 text-lg max-w-2xl">
          Сфотографируйте вещи по одной — вырежем фон и предложим образ по цвету. Всё считается в
          вашем браузере, фото никуда не отправляются.
        </p>

        <div className="mt-12">
          <h2 className="font-display text-xs uppercase tracking-wide text-white/40 mb-4">
            Как сочетать цвета
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RULES.map((rule) => (
              <div
                key={rule.title}
                className="rounded-2xl bg-panel border border-line p-4 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  {rule.swatches.map((c, i) => (
                    <span
                      key={c + i}
                      className={`rounded-full border border-white/10 ${rule.sizes?.[i] ?? "w-5 h-5"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="font-display font-semibold text-sm">{rule.title}</div>
                <p className="mt-1 text-xs text-white/50">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <WardrobeStudio />
        </div>
      </div>
    </main>
  );
}
