"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type State = "idle" | "loading" | "done";

const STYLE: Record<State, React.CSSProperties> = {
  idle: { width: "0%", opacity: 0, transition: "none" },
  // Быстро до ~60%, дальше всё медленнее — пока сервер отвечает.
  loading: { width: "85%", opacity: 1, transition: "width 8s cubic-bezier(0.1, 0.7, 0.2, 1)" },
  done: { width: "100%", opacity: 0, transition: "width 0.2s ease, opacity 0.3s ease 0.15s" }
};

// Тонкая полоска загрузки сверху при переходах по внутренним ссылкам.
export default function TopLoader() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || url.pathname.startsWith("/api/")) return;
      setState("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
  }, [pathname]);

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setState("idle"), 450);
    return () => clearTimeout(t);
  }, [state]);

  return <div aria-hidden className="fixed top-0 left-0 z-[100] h-[2px] bg-white shadow-[0_0_8px_white]" style={STYLE[state]} />;
}
