import WardrobeStudio from "@/components/WardrobeStudio";

export default function WardrobePage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
        ← на главную
      </a>
      <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 tracking-tight">Гардероб</h1>
      <p className="text-white/50 mt-3 text-lg max-w-2xl">
        Сфотографируйте вещи по одной — вырежем фон и предложим образ по цвету. Всё считается в
        вашем браузере, фото никуда не отправляются.
      </p>
      <div className="mt-10">
        <WardrobeStudio />
      </div>
    </main>
  );
}
