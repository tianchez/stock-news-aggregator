import { NextResponse } from "next/server";
import { getStocks } from "@/lib/db";
import {
  fetchQuote,
  fetchRecommendations,
} from "@/lib/finnhub";
import {
  getQuoteUpdatedAt,
  saveQuote,
  getQuote,
  saveRecommendations,
  getRecommendations,
} from "@/lib/db";

const FIVE_MIN_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const stocks = await getStocks();
    const results = await Promise.all(
      stocks.map(async (stock) => {
        const upper = stock.symbol.toUpperCase();
        const lastUpdate = await getQuoteUpdatedAt(upper);
        const now = new Date();
        const needsFresh =
          !lastUpdate || now.getTime() - lastUpdate.getTime() > FIVE_MIN_MS;

        if (needsFresh) {
          const [quote, recs] = await Promise.all([
            fetchQuote(upper).catch(() => null),
            fetchRecommendations(upper).catch(() => []),
          ]);
          if (quote) await saveQuote(upper, quote);
          if (recs.length > 0) await saveRecommendations(upper, recs);
        }

        const [quote, recs] = await Promise.all([
          getQuote(upper),
          getRecommendations(upper),
        ]);

        const latestRec = recs[0];
        let signal: "buy" | "sell" | "hold" | "neutral" = "neutral";
        if (latestRec) {
          const bullish =
            Number(latestRec.strong_buy) + Number(latestRec.buy);
          const bearish =
            Number(latestRec.strong_sell) + Number(latestRec.sell);
          const total = bullish + bearish + Number(latestRec.hold);
          if (total > 0) {
            if (bullish / total > 0.6) signal = "buy";
            else if (bearish / total > 0.4) signal = "sell";
            else signal = "hold";
          }
        }

        return {
          symbol: stock.symbol,
          name: stock.name,
          quote,
          signal,
          recommendation: latestRec,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
