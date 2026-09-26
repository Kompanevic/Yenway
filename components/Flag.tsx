import type { RegionKey } from "@/lib/regions";

// SVG-флаги: эмодзи-флаги на Windows показываются буквами («JP»).
const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.4 : r;
    return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

const FLAGS: Record<RegionKey, JSX.Element> = {
  japan: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </>
  ),
  usa: (
    <>
      <rect width="30" height="20" fill="#B22234" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} y={(2 * i + 1) * (20 / 13)} width="30" height={20 / 13} fill="#fff" />
      ))}
      <rect width="13" height={(20 / 13) * 7} fill="#3C3B6E" />
    </>
  ),
  europe: (
    <>
      <rect width="30" height="20" fill="#039" />
      {Array.from({ length: 12 }, (_, i) => (
        <polygon
          key={i}
          points={star(15 + 6 * Math.cos((i * Math.PI) / 6), 10 + 6 * Math.sin((i * Math.PI) / 6), 1.1)}
          fill="#FC0"
        />
      ))}
    </>
  ),
  china: (
    <>
      <rect width="30" height="20" fill="#EE1C25" />
      <polygon points={star(5, 5, 3)} fill="#FF0" />
      {[
        [10, 2],
        [12, 4],
        [12, 7],
        [10, 9]
      ].map(([x, y]) => (
        <polygon key={`${x}${y}`} points={star(x, y, 1)} fill="#FF0" />
      ))}
    </>
  ),
  korea: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <path d="M10 10a5 5 0 0 1 10 0z" fill="#CD2E3A" />
      <path d="M10 10a5 5 0 0 0 10 0z" fill="#0047A0" />
      <g stroke="#000" strokeWidth="1">
        <path d="M3 3l3.5 3.5M4.5 1.5 8 5M27 3l-3.5 3.5M25.5 1.5 22 5M3 17l3.5-3.5M4.5 18.5 8 15M27 17l-3.5-3.5M25.5 18.5 22 15" />
      </g>
    </>
  )
};

export default function Flag({ region, className = "" }: { region: RegionKey; className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      {FLAGS[region]}
    </svg>
  );
}
