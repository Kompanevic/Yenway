export type RegionKey = "japan" | "europe" | "usa" | "china" | "korea";

export interface Region {
  key: RegionKey;
  name: string;
  flag: string;
  currency: string;
  tagline: string;
  platforms: string[];
}

// Порядок ниже = порядок в верхнем меню и на главной (слева направо)
export const REGIONS: Record<RegionKey, Region> = {
  japan: {
    key: "japan",
    name: "Япония",
    flag: "🇯🇵",
    currency: "JPY",
    tagline: "Mercari, Rakuten, Yahoo Shopping, ZOZOTOWN и другие площадки",
    platforms: ["Mercari", "Rakuten", "Yahoo! Shopping", "ZOZOTOWN", "Yahoo! Auctions"]
  },
  europe: {
    key: "europe",
    name: "Европа",
    flag: "🇪🇺",
    currency: "EUR",
    tagline: "ASOS, Zalando, Vinted, SSENSE и другие площадки",
    platforms: ["ASOS", "Zalando", "Vinted", "SSENSE", "eBay.de"]
  },
  usa: {
    key: "usa",
    name: "США",
    flag: "🇺🇸",
    currency: "USD",
    tagline: "Amazon, eBay, StockX, Nike и другие площадки",
    platforms: ["Amazon", "eBay", "StockX", "Nike.com", "Farfetch US"]
  },
  china: {
    key: "china",
    name: "Китай",
    flag: "🇨🇳",
    currency: "CNY",
    tagline: "Taobao, Weidian, 1688, Poizon и другие площадки",
    platforms: ["Taobao", "Weidian", "1688", "Poizon (得物)", "Tmall"]
  },
  korea: {
    key: "korea",
    name: "Корея",
    flag: "🇰🇷",
    currency: "KRW",
    tagline: "Coupang, Musinsa, Naver Shopping, Gmarket и другие площадки",
    platforms: ["Coupang", "Musinsa", "Naver Shopping", "Gmarket", "29CM"]
  }
};

export const REGION_LIST = Object.values(REGIONS);
