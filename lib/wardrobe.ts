export type ItemCategory = "top" | "bottom" | "outer" | "shoes" | "accessory";

export const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: "top", label: "Верх" },
  { id: "bottom", label: "Низ" },
  { id: "outer", label: "Верхняя одежда" },
  { id: "shoes", label: "Обувь" },
  { id: "accessory", label: "Аксессуар" }
];

export interface WardrobeItem {
  id: string;
  category: ItemCategory;
  image: string; // dataURL, фон уже вырезан
  color: string; // hex доминирующего цвета
  colorFamily: string;
}

const PALETTE: { name: string; rgb: [number, number, number]; neutral?: boolean }[] = [
  { name: "чёрный", rgb: [20, 20, 20], neutral: true },
  { name: "белый", rgb: [245, 245, 245], neutral: true },
  { name: "серый", rgb: [130, 130, 130], neutral: true },
  { name: "бежевый", rgb: [210, 190, 160], neutral: true },
  { name: "коричневый", rgb: [110, 75, 50], neutral: true },
  { name: "тёмно-синий", rgb: [30, 40, 80] },
  { name: "синий", rgb: [50, 90, 200] },
  { name: "голубой", rgb: [130, 180, 230] },
  { name: "зелёный", rgb: [60, 120, 70] },
  { name: "жёлтый", rgb: [220, 200, 60] },
  { name: "оранжевый", rgb: [220, 120, 40] },
  { name: "красный", rgb: [190, 40, 40] },
  { name: "розовый", rgb: [230, 150, 180] },
  { name: "фиолетовый", rgb: [120, 70, 160] }
];

function dist(a: [number, number, number], b: [number, number, number]) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

export function nearestColorFamily(hex: string): { name: string; neutral: boolean } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let best = PALETTE[0];
  let bestDist = Infinity;
  for (const p of PALETTE) {
    const d = dist([r, g, b], p.rgb);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return { name: best.name, neutral: !!best.neutral };
}

// Достаём средний цвет непрозрачных пикселей вырезанного изображения
export function extractDominantColor(imageData: ImageData): string {
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4 * 5) {
    if (data[i + 3] < 128) continue; // прозрачный пиксель — фон
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (count === 0) return "#888888";
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function compatible(a: WardrobeItem, b: WardrobeItem): boolean {
  const famA = nearestColorFamily(a.color);
  const famB = nearestColorFamily(b.color);
  if (famA.neutral || famB.neutral) return true;
  return famA.name === famB.name;
}

export interface Outfit {
  items: WardrobeItem[];
}

// Простой подбор: верх + низ (+ верхняя одежда/обувь, если подходят по цвету)
export function buildOutfit(items: WardrobeItem[]): Outfit | null {
  const tops = items.filter((i) => i.category === "top");
  const bottoms = items.filter((i) => i.category === "bottom");
  const outers = items.filter((i) => i.category === "outer");
  const shoes = items.filter((i) => i.category === "shoes");
  const accessories = items.filter((i) => i.category === "accessory");

  if (tops.length === 0 || bottoms.length === 0) return null;

  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!compatible(top, bottom)) continue;
      const picked: WardrobeItem[] = [top, bottom];
      const outer = outers.find((o) => compatible(o, top) && compatible(o, bottom));
      if (outer) picked.push(outer);
      const shoe = shoes.find((s) => compatible(s, bottom));
      if (shoe) picked.push(shoe);
      const acc = accessories.find((a) => compatible(a, top) || compatible(a, bottom));
      if (acc) picked.push(acc);
      return { items: picked };
    }
  }
  return null;
}
