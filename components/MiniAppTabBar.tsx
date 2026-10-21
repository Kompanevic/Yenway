"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, CalcIcon, GridIcon, ShieldIcon, UserIcon } from "./Icons";
import { useList, useMiniApp } from "@/lib/tg-webapp";

const TABS = [
  { href: "/preorder", label: "Лента", Icon: GridIcon, match: ["/preorder", "/stock", "/bought"] },
  { href: "/order", label: "Расчёт", Icon: CalcIcon, match: ["/order"] },
  { href: "/legit", label: "Легит", Icon: ShieldIcon, match: ["/legit"] },
  { href: "/cart", label: "Корзина", Icon: BagIcon, match: ["/cart"] },
  { href: "/profile", label: "Профиль", Icon: UserIcon, match: ["/profile", "/favorites"] }
];

// Нижняя панель — только в мини-аппе Telegram; на сайте её нет.
export default function MiniAppTabBar() {
  const miniApp = useMiniApp();
  const pathname = usePathname();
  const cart = useList("cart");
  if (!miniApp) return null;
  const active = (m: string[]) => m.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg grid grid-cols-5">
        {TABS.map(({ href, label, Icon, match }) => {
          const on = active(match);
          return (
            <Link key={href} href={href} className={`relative flex flex-col items-center gap-1 py-2.5 transition-colors ${on ? "text-white" : "text-white/40"}`}>
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" />
                {href === "/cart" && cart.ids.length > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-accent text-ink text-[10px] font-bold leading-4 text-center">
                    {cart.ids.length}
                  </span>
                )}
              </span>
              <span className="font-display text-[10px] tracking-wide">{label}</span>
              {on && <span className="absolute top-0 h-px w-8 bg-white" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
