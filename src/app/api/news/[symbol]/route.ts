import { NextRequest, NextResponse } from "next/server";
import {
  getLastFetchTime,
  getNewsFromDb,
  saveNews,
  updateFetchTime,
} from "@/lib/db";
import { fetchStockNews } from "@/lib/finnhub";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    const lastFetch = await getLastFetchTime(upperSymbol);
    const now = new Date();
    const needsFresh =
      !lastFetch || now.getTime() - lastFetch.getTime() > ONE_HOUR_MS;

    if (needsFresh) {
      const articles = await fetchStockNews(upperSymbol);
      if (articles.length > 0) {
        await saveNews(upperSymbol, articles);
      }
      await updateFetchTime(upperSymbol);
    }

    const news = await getNewsFromDb(upperSymbol);
    return NextResponse.json({
      news,
      source: needsFresh ? "api" : "cache",
      lastFetched: lastFetch?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
