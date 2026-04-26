import { NewsArticle } from "./db";

const BASE = "https://finnhub.io/api/v1";

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not configured");
  return key;
}

async function get<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${apiKey()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Finnhub ${path}: ${res.status}`);
  return res.json();
}

export async function fetchStockNews(symbol: string): Promise<NewsArticle[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  return get(`/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}`);
}

export interface Quote {
  c: number;  // current
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  return get(`/quote?symbol=${symbol}`);
}

export interface Recommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
  symbol: string;
}

export async function fetchRecommendations(
  symbol: string
): Promise<Recommendation[]> {
  return get(`/stock/recommendation?symbol=${symbol}`);
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export async function fetchProfile(
  symbol: string
): Promise<CompanyProfile> {
  return get(`/stock/profile2?symbol=${symbol}`);
}

export interface BasicFinancials {
  metric: {
    "10DayAverageTradingVolume"?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "52WeekHighDate"?: string;
    "52WeekLowDate"?: string;
    beta?: number;
    peBasicExclExtraTTM?: number;
    epsBasicExclExtraTTM?: number;
    dividendYieldIndicatedAnnual?: number;
    marketCapitalization?: number;
    [key: string]: number | string | undefined;
  };
}

export async function fetchMetrics(
  symbol: string
): Promise<BasicFinancials> {
  return get(`/stock/metric?symbol=${symbol}&metric=all`);
}
