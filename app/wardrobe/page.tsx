import WardrobeStudio from "@/components/WardrobeStudio";
import ColorWheel from "@/components/ColorWheel";

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
    <main className="relative">
      <ColorWheel />
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="lg:max-w-xl">
          <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
            ← на главную
          </a>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 tracking-tight">
            Гардероб
          </h1>
          <p className="text-white/50 mt-3 text-lg">
            Сфотографируйте вещи по одной — вырежем фон и предложим образ по цвету. Всё считается
            в вашем браузере, фото никуда не отправляются.
          </p>

          <div className="mt-12">
            <h2 className="font-display text-xs uppercase tracking-wide text-white/40 mb-4">
              Как сочетать цвета
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
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
      </div>
    </main>
  );
}
