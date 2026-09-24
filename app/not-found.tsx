import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-6xl font-bold">404</div>
      <p className="mt-4 text-white/50 max-w-sm">
        Такой страницы нет — возможно, вещь уже продана или ссылка устарела.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="font-display rounded-full bg-accent text-ink px-6 py-3 font-semibold hover:bg-accent2 transition-colors">
          На главную
        </Link>
        <Link href="/stock" className="font-display rounded-full border border-line px-6 py-3 hover:border-white/40 transition-colors">
          В наличии
        </Link>
      </div>
    </main>
  );
}
