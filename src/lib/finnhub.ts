import { NewsArticle } from "./db";

export async function fetchStockNews(symbol: string): Promise<NewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY is not configured");
  }

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  const res = await fetch(
    `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}&token=${apiKey}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Finnhub API error: ${res.status}`);
  }

  return res.json();
}
