const ICONS: { symbol: string; top: string; left: string; size: number; rotate: number }[] = [
  { symbol: "★", top: "2%", left: "6%", size: 90, rotate: -12 },
  { symbol: "$", top: "6%", left: "86%", size: 64, rotate: 10 },
  { symbol: "¥", top: "16%", left: "42%", size: 54, rotate: -6 },
  { symbol: "★", top: "26%", left: "92%", size: 110, rotate: 16 },
  { symbol: "€", top: "34%", left: "3%", size: 76, rotate: -10 },
  { symbol: "$", top: "44%", left: "62%", size: 50, rotate: 6 },
  { symbol: "★", top: "54%", left: "18%", size: 66, rotate: 20 },
  { symbol: "¥", top: "62%", left: "84%", size: 92, rotate: -9 },
  { symbol: "€", top: "72%", left: "38%", size: 60, rotate: 12 },
  { symbol: "★", top: "80%", left: "70%", size: 48, rotate: -16 },
  { symbol: "$", top: "88%", left: "10%", size: 72, rotate: 8 },
  { symbol: "€", top: "95%", left: "94%", size: 58, rotate: -14 }
];

export default function GlassIcons() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {ICONS.map((icon, i) => (
        <div
          key={i}
          className="absolute rounded-full flex items-center justify-center font-display select-none"
          style={{
            top: icon.top,
            left: icon.left,
            width: icon.size,
            height: icon.size,
            fontSize: icon.size * 0.42,
            transform: `rotate(${icon.rotate}deg)`,
            background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02))",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 10px 30px rgba(0,0,0,0.3)",
            color: "rgba(255,255,255,0.4)"
          }}
        >
          {icon.symbol}
        </div>
      ))}
    </div>
  );
}
