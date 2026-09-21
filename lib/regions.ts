export type RegionKey = "japan" | "europe" | "usa" | "china" | "korea";

export interface Platform {
  name: string;
  url: string;
}

export interface Region {
  key: RegionKey;
  name: string;
  flag: string;
  currency: string;
  tagline: string;
  platforms: Platform[];
}

// Порядок ниже = порядок в верхнем меню и на главной (слева направо)
export const REGIONS: Record<RegionKey, Region> = {
  japan: {
    key: "japan",
    name: "Япония",
    flag: "🇯🇵",
    currency: "JPY",
    tagline: "Mercari, Rakuten, ZOZOTOWN, Yahoo! Auctions и другие площадки",
    platforms: [
      { name: "Mercari", url: "https://jp.mercari.com" },
      { name: "Rakuten", url: "https://www.rakuten.co.jp" },
      { name: "ZOZOTOWN", url: "https://zozo.jp" },
      { name: "Yahoo! Auctions", url: "https://auctions.yahoo.co.jp" }
    ]
  },
  europe: {
    key: "europe",
    name: "Европа",
    flag: "🇪🇺",
    currency: "EUR",
    tagline: "SSENSE, Farfetch, END., Vinted и другие площадки",
    platforms: [
      { name: "SSENSE", url: "https://www.ssense.com" },
      { name: "Farfetch", url: "https://www.farfetch.com" },
      { name: "END.", url: "https://www.endclothing.com" },
      { name: "Vinted", url: "https://www.vinted.com" },
      { name: "Zalando", url: "https://www.zalando.com" }
    ]
  },
  usa: {
    key: "usa",
    name: "США",
    flag: "🇺🇸",
    currency: "USD",
    tagline: "Grailed, GOAT, StockX, Farfetch и другие площадки",
    platforms: [
      { name: "Grailed", url: "https://www.grailed.com" },
      { name: "GOAT", url: "https://www.goat.com" },
      { name: "StockX", url: "https://stockx.com" },
      { name: "Nike SNKRS", url: "https://www.nike.com/launch" },
      { name: "eBay", url: "https://www.ebay.com" }
    ]
  },
  china: {
    key: "china",
    name: "Китай",
    flag: "🇨🇳",
    currency: "CNY",
    tagline: "Taobao, 1688, Poizon, 95分, Xianyu и другие площадки",
    platforms: [
      { name: "Taobao", url: "https://www.taobao.com" },
      { name: "1688", url: "https://www.1688.com" },
      { name: "Poizon (得物)", url: "https://www.dewu.com" },
      { name: "95分", url: "https://www.95fen.com" },
      { name: "Xianyu (闲鱼)", url: "https://2.taobao.com" }
    ]
  },
  korea: {
    key: "korea",
    name: "Корея",
    flag: "🇰🇷",
    currency: "KRW",
    tagline: "Coupang, Musinsa, Naver Shopping, Gmarket и другие площадки",
    platforms: [
      { name: "Coupang", url: "https://www.coupang.com" },
      { name: "Musinsa", url: "https://www.musinsa.com" },
      { name: "Naver Shopping", url: "https://shopping.naver.com" },
      { name: "Gmarket", url: "https://www.gmarket.co.kr" },
      { name: "29CM", url: "https://www.29cm.co.kr" }
    ]
  }
};

export const REGION_LIST = Object.values(REGIONS);
