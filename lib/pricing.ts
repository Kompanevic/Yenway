import { RegionKey } from "./regions";

/**
 * Курсы и тарифы. Обновляй только эти константы — остального в проекте
 * трогать не нужно. null = ещё не задано, на сайте покажется
 * "уточняется индивидуально".
 */

export const MANUAL_REGIONS: RegionKey[] = ["usa", "europe"];
export const MANAGER_TELEGRAM = "yenwayceo";

export function isManualRegion(region: RegionKey): boolean {
  return MANUAL_REGIONS.includes(region);
}

// Курс валюты площадки к рублю (сколько RUB стоит 1 единица валюты)
export const EXCHANGE_RATES: Record<RegionKey, number | null> = {
  japan: 0.67,
  korea: 0.08,
  china: 14.1,
  usa: null,
  europe: null
};

export const CURRENCIES = ["JPY", "CNY", "KRW", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

const CURRENCY_REGION: Record<Currency, RegionKey> = {
  JPY: "japan",
  CNY: "china",
  KRW: "korea",
  USD: "usa",
  EUR: "europe"
};

// Только по курсу, без доставки и комиссий. null — курс для валюты не задан.
export function convertToRub(amount: number, currency: Currency): number | null {
  const rate = EXCHANGE_RATES[CURRENCY_REGION[currency]];
  return rate == null ? null : Math.round(amount * rate);
}

// Комиссия сервиса, ₽ — фиксированная сумма (не %)
export const COMMISSION_RUB: Record<RegionKey, number | null> = {
  japan: 600, // любая японская площадка кроме Mercari
  korea: 600,
  china: 400,
  usa: null,
  europe: null
};

// Для Японии комиссия ниже, если ссылка с Mercari
export const MERCARI_COMMISSION_RUB = 500;

export const INSURANCE_RUB: Record<RegionKey, number | null> = {
  japan: 150,
  china: 200,
  korea: 300,
  usa: null,
  europe: null
};

export const SERVICE_FEE_RUB: Record<RegionKey, number | null> = {
  japan: 200,
  china: null,
  korea: null,
  usa: null,
  europe: null
};

// Доставка — фиксированная ставка за кг (Япония, Корея)
export const DELIVERY_PER_KG_RUB: Partial<Record<RegionKey, number>> = {
  japan: 1800,
  korea: 1500
};

export const DELIVERY_DAYS: Partial<Record<RegionKey, string>> = {
  japan: "25–30 дней, со склада",
  korea: "20–25 дней до Москвы"
};

// Доставка из Китая — три тарифа на выбор, ставка за кг
export interface ChinaDeliveryTier {
  id: string;
  label: string;
  ratePerKg: number;
  days: string;
}

export const CHINA_DELIVERY_TIERS: ChinaDeliveryTier[] = [
  { id: "standard", label: "Стандарт", ratePerKg: 800, days: "20–25 дней" },
  { id: "fast", label: "Быстрая", ratePerKg: 1200, days: "10–15 дней" },
  { id: "express", label: "Экспресс", ratePerKg: 3000, days: "1–4 дня" }
];

export const CUSTOMS_NOTE = "Возможны таможенные пошлины — около 15% от суммы заказа, оплачиваются дополнительно.";

function getCommissionRub(region: RegionKey, sourceUrl: string): number | null {
  if (region === "japan") {
    try {
      if (new URL(sourceUrl).hostname.includes("mercari")) return MERCARI_COMMISSION_RUB;
    } catch {
      // ignore, fall through to base rate
    }
  }
  return COMMISSION_RUB[region];
}

function getDelivery(
  region: RegionKey,
  weightKg: number | null,
  chinaTierId: string | undefined
): { deliveryRUB: number | null; deliveryDays: string | null } {
  if (region === "china") {
    const tier = CHINA_DELIVERY_TIERS.find((t) => t.id === chinaTierId) ?? CHINA_DELIVERY_TIERS[0];
    return {
      deliveryRUB: weightKg != null ? Math.round(tier.ratePerKg * weightKg) : null,
      deliveryDays: tier.days
    };
  }
  const ratePerKg = DELIVERY_PER_KG_RUB[region];
  return {
    deliveryRUB: ratePerKg != null && weightKg != null ? Math.round(ratePerKg * weightKg) : null,
    deliveryDays: DELIVERY_DAYS[region] ?? null
  };
}

export interface PriceBreakdown {
  itemPriceLocal: number | null;
  itemPriceRUB: number | null;
  commissionRUB: number | null;
  insuranceRUB: number | null;
  serviceFeeRUB: number | null;
  deliveryRUB: number | null;
  deliveryDays: string | null;
  totalRUB: number | null;
  hasIndividualParts: boolean;
  isEstimate: boolean;
}

export function calculatePrice(
  itemPriceLocal: number | null,
  region: RegionKey,
  sourceUrl: string,
  weightKg: number | null,
  chinaTierId?: string
): PriceBreakdown {
  const rate = EXCHANGE_RATES[region];
  const commissionRUB = getCommissionRub(region, sourceUrl);
  const insuranceRUB = INSURANCE_RUB[region];
  const serviceFeeRUB = SERVICE_FEE_RUB[region];
  const { deliveryRUB, deliveryDays } = getDelivery(region, weightKg, chinaTierId);
  const hasIndividualParts = [commissionRUB, insuranceRUB, serviceFeeRUB, deliveryRUB].some(
    (v) => v == null
  );

  if (itemPriceLocal == null || Number.isNaN(itemPriceLocal) || rate == null) {
    return {
      itemPriceLocal: null,
      itemPriceRUB: null,
      commissionRUB,
      insuranceRUB,
      serviceFeeRUB,
      deliveryRUB,
      deliveryDays,
      totalRUB: null,
      hasIndividualParts,
      isEstimate: true
    };
  }

  const itemPriceRUB = Math.round(itemPriceLocal * rate);
  const totalRUB = [itemPriceRUB, commissionRUB, insuranceRUB, serviceFeeRUB, deliveryRUB]
    .filter((v): v is number => v != null)
    .reduce((a, b) => a + b, 0);

  return {
    itemPriceLocal,
    itemPriceRUB,
    commissionRUB,
    insuranceRUB,
    serviceFeeRUB,
    deliveryRUB,
    deliveryDays,
    totalRUB,
    hasIndividualParts,
    isEstimate: false
  };
}
