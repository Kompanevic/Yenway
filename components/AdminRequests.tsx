"use client";

import { useEffect, useState } from "react";
import { REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL, type CustomerRequestView, type RequestStatus } from "@/lib/request-constants";

// Админка: все заявки клиентов и их статусы (клиент видит статус в профиле мини-аппа).
export default function AdminRequests() {
  const [items, setItems] = useState<CustomerRequestView[]>([]);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/admin/requests");
    const d = await r.json().catch(() => ({}));
    if (r.ok) setItems(d.requests ?? []);
    else setError(d.error ?? "Не удалось загрузить");
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: RequestStatus) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    const r = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!r.ok) load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить заявку?")) return;
    await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
    load();
  }

  const shown = items.filter((x) => filter === "all" || (x.status !== "delivered" && x.status !== "canceled"));

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        {(["active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-display text-sm rounded-full px-4 py-1.5 border ${filter === f ? "bg-accent text-ink border-accent font-semibold" : "border-line text-white/60"}`}
          >
            {f === "active" ? "Активные" : "Все"}
          </button>
        ))}
        <span className="ml-auto text-sm text-white/40">{shown.length} шт.</span>
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-5 space-y-2">
        {shown.length === 0 ? (
          <p className="text-sm text-white/40">Заявок нет.</p>
        ) : (
          shown.map((x) => (
            <div key={x.id} className="rounded-2xl bg-panel/90 border border-line p-4 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wide text-white/40">
                  {REQUEST_TYPE_LABEL[x.type]} · {new Date(x.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {x.tgId ? " · из приложения" : ""}
                </div>
                <div className="font-display text-sm font-semibold truncate mt-0.5">
                  {x.link ? (
                    <a href={x.link} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                      {x.title}
                    </a>
                  ) : (
                    x.title
                  )}
                </div>
                <div className="text-xs text-white/50 mt-0.5">
                  <a href={`https://t.me/${x.username}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    @{x.username}
                  </a>
                  {x.price ? ` · ${x.price.toLocaleString("ru-RU")} ₽` : ""}
                </div>
              </div>
              <select
                value={x.status}
                onChange={(e) => setStatus(x.id, e.target.value as RequestStatus)}
                className="rounded-xl bg-ink border border-line px-3 py-2 text-sm"
              >
                {(Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {REQUEST_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button onClick={() => remove(x.id)} className="text-sm text-red-400/70 hover:text-red-400">
                Удалить
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
