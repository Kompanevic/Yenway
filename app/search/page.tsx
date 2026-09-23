import SearchForm from "@/components/SearchForm";

export default function SearchPage() {
  return (
    <main>
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">
        <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
          ← на главную
        </a>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 tracking-tight">
          Найти и выкупить вещь
        </h1>
        <p className="text-white/50 mt-3 text-lg">
          Нет ссылки на нужную вещь? Пришлите фото, название и свой размер — мы найдём её на
          площадках и оформим выкуп.
        </p>

        <div className="mt-10">
          <SearchForm />
        </div>
      </div>
    </main>
  );
}
