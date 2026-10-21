// Тонкие иконки в одном стиле для мини-аппа и кнопок вещи.
type P = { className?: string; filled?: boolean };
const base = (className?: string) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true
});

export const HeartIcon = ({ className, filled }: P) => (
  <svg {...base(className)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);
export const BookmarkIcon = ({ className, filled }: P) => (
  <svg {...base(className)} fill={filled ? "currentColor" : "none"}>
    <path d="M6 4h12v16l-6-4-6 4Z" />
  </svg>
);
export const BagIcon = ({ className, filled }: P) => (
  <svg {...base(className)} fill={filled ? "currentColor" : "none"}>
    <path d="M5 8h14l-1 12H6Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" />
  </svg>
);
export const EyeIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);
export const GridIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
export const CalcIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
  </svg>
);
export const ShieldIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const UserIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
