import { RegionKey } from "./regions";

/**
 * ЗАГЛУШКА. Замени на реальные курсы и тарифы, когда они будут готовы.
 * Всё в одном месте — больше ничего в проекте трогать не нужно.
 */

// Курсы валют к рублю (сколько RUB стоит 1 единица валюты)
export const EXCHANGE_RATES: Record<RegionKey, number> = {
  japan: 0.65, // 1 JPY
  korea: 0.06, // 1 KRW
  china: 12.8, // 1 CNY
  usa: 90, // 1 USD
  europe: 98 // 1 EUR
};

// Фиксированная стоимость доставки по региону, руб.
export const DELIVERY_FLAT_RUB: Record<RegionKey, number> = {
  japan: 2500,
  korea: 2000,
  china: 1500,
  usa: 3000,
  europe: 3500
};

export const SERVICE_FEE_PERCENT = 10; // комиссия сервиса
export const INSURANCE_PERCENT = 3; // страховка от стоимости товара

export interface PriceBreakdown {
  itemPriceLocal: number | null;
  currency: string;
  itemPriceRUB: number | null;
  serviceFeeRUB: number | null;
  insuranceRUB: number | null;
  deliveryRUB: number;
  totalRUB: number | null;
  isEstimate: boolean;
}

export function calculatePrice(itemPriceLocal: number | null, region: RegionKey): PriceBreakdown {
  const rate = EXCHANGE_RATES[region];
  const delivery = DELIVERY_FLAT_RUB[region];

  if (itemPriceLocal == null || Number.isNaN(itemPriceLocal)) {
    return {
      itemPriceLocal: null,
      currency: region,
      itemPriceRUB: null,
      serviceFeeRUB: null,
      insuranceRUB: null,
      deliveryRUB: delivery,
      totalRUB: null,
      isEstimate: true
    };
  }

  const itemPriceRUB = Math.round(itemPriceLocal * rate);
  const serviceFeeRUB = Math.round((itemPriceRUB * SERVICE_FEE_PERCENT) / 100);
  const insuranceRUB = Math.round((itemPriceRUB * INSURANCE_PERCENT) / 100);
  const totalRUB = itemPriceRUB + serviceFeeRUB + insuranceRUB + delivery;

  return {
    itemPriceLocal,
    currency: region,
    itemPriceRUB,
    serviceFeeRUB,
    insuranceRUB,
    deliveryRUB: delivery,
    totalRUB,
    isEstimate: false
  };
}
