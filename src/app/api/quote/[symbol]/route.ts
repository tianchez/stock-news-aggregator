import { NextRequest, NextResponse } from "next/server";
import {
  getQuote,
  getQuoteUpdatedAt,
  saveQuote,
  saveRecommendations,
  saveMetrics,
  getRecommendations,
  getMetrics,
} from "@/lib/db";
import {
  fetchQuote,
  fetchRecommendations,
  fetchMetrics,
} from "@/lib/finnhub";

const FIVE_MIN_MS = 5 * 60 * 1000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upper = symbol.toUpperCase();

    const lastUpdate = await getQuoteUpdatedAt(upper);
    const now = new Date();
    const needsFresh =
      !lastUpdate || now.getTime() - lastUpdate.getTime() > FIVE_MIN_MS;

    if (needsFresh) {
      const [quote, recs, metrics] = await Promise.all([
        fetchQuote(upper),
        fetchRecommendations(upper).catch(() => []),
        fetchMetrics(upper).catch(() => ({ metric: {} as Record<string, number | string | undefined> })),
      ]);

      await saveQuote(upper, quote);
      if (recs.length > 0) await saveRecommendations(upper, recs);

      const m = metrics.metric || {};
      await saveMetrics(upper, {
        week52High: m["52WeekHigh"] as number | undefined,
        week52Low: m["52WeekLow"] as number | undefined,
        beta: m.beta as number | undefined,
        pe: m.peBasicExclExtraTTM as number | undefined,
        eps: m.epsBasicExclExtraTTM as number | undefined,
        dividendYield: m.dividendYieldIndicatedAnnual as number | undefined,
        marketCap: m.marketCapitalization as number | undefined,
        avgVolume: m["10DayAverageTradingVolume"] as number | undefined,
      });
    }

    const [quote, recs, metrics] = await Promise.all([
      getQuote(upper),
      getRecommendations(upper),
      getMetrics(upper),
    ]);

    return NextResponse.json({
      quote,
      recommendations: recs,
      metrics,
      source: needsFresh ? "api" : "cache",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
