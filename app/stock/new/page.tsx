import ListingForm from "@/components/ListingForm";

export const metadata = { title: "Выложить вещь — YenWay" };

export default function NewListingPage() {
  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <a href="/stock" className="text-white/40 text-sm hover:text-white/70 transition-colors">
        ← В наличии
      </a>
      <h1 className="font-display text-4xl font-bold mt-5 tracking-tight">Выложить свою вещь</h1>
      <p className="text-white/50 mt-3">
        Объявление появится в ленте после проверки. Продажа проходит через YenWay — мы свяжемся с вами в
        Telegram, когда найдётся покупатель.
      </p>
      <div className="mt-10 rounded-3xl bg-panel border border-line p-6 sm:p-7">
        <ListingForm />
      </div>
    </main>
  );
}
