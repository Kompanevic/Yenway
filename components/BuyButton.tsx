"use client";

import { useState } from "react";

export default function BuyButton({ id, label = "Хочу купить" }: { id: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/stock/${id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось отправить");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <p className="text-accent">Заявка отправлена! Мы напишем вам в Telegram.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-display w-full rounded-2xl bg-accent text-ink py-4 font-semibold text-lg hover:bg-accent2 transition-colors"
      >
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        required
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Ваш ник в Telegram"
        className="w-full rounded-2xl bg-ink border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="font-display w-full rounded-2xl bg-accent text-ink py-4 font-semibold text-lg hover:bg-accent2 transition-colors disabled:opacity-50"
      >
        {loading ? "Отправляем..." : "Отправить заявку"}
      </button>
    </form>
  );
}
