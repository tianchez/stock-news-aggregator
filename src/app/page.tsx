"use client";

import { useState, useEffect, useCallback } from "react";

interface Stock {
  id: number;
  symbol: string;
  name: string;
}

interface QuoteData {
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  open_price: number;
  prev_close: number;
}

interface RecData {
  strong_buy: number;
  buy: number;
  hold: number;
  sell: number;
  strong_sell: number;
  period: string;
}

interface MetricsData {
  week52_high: number | null;
  week52_low: number | null;
  beta: number | null;
  pe_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  market_cap: number | null;
  avg_volume: number | null;
}

interface DashboardStock {
  symbol: string;
  name: string;
  quote: QuoteData | null;
  signal: "buy" | "sell" | "hold" | "neutral";
  recommendation: RecData | null;
}

interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image_url: string;
  published_at: string;
}

type Tab = "overview" | "news" | "analysis";

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStock[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [detailQuote, setDetailQuote] = useState<QuoteData | null>(null);
  const [detailRecs, setDetailRecs] = useState<RecData[]>([]);
  const [detailMetrics, setDetailMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      if (res.ok) setStocks(await res.json());
    } catch {
      setError("Failed to load stocks");
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) setDashboard(await res.json());
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks().then(fetchDashboard);
  }, [fetchStocks, fetchDashboard]);

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newSymbol.trim().toUpperCase(),
          name: newName.trim() || newSymbol.trim().toUpperCase(),
        }),
      });
      if (res.ok) {
        setNewSymbol("");
        setNewName("");
        await fetchStocks();
        await fetchDashboard();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add stock");
      }
    } catch {
      setError("Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const removeStock = async (symbol: string) => {
    try {
      const res = await fetch(`/api/stocks/${symbol}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedStock === symbol) {
          setSelectedStock(null);
          setNews([]);
        }
        await fetchStocks();
        await fetchDashboard();
      }
    } catch {
      setError("Failed to delete stock");
    }
  };

  const selectStock = async (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab("overview");
    loadStockDetail(symbol);
    loadNews(symbol);
  };

  const loadStockDetail = async (symbol: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/quote/${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setDetailQuote(data.quote);
        setDetailRecs(data.recommendations || []);
        setDetailMetrics(data.metrics);
      }
    } catch {
      setError("Failed to load stock details");
    } finally {
      setDetailLoading(false);
    }
  };

  const loadNews = async (symbol: string) => {
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/news/${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news);
      }
    } catch {
      setError("Failed to load news");
    } finally {
      setNewsLoading(false);
    }
  };

  const formatPrice = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toFixed(2)}` : "—";

  const formatPct = (n: number | null | undefined) =>
    n != null ? `${Number(n) >= 0 ? "+" : ""}${Number(n).toFixed(2)}%` : "—";

  const formatLargeNum = (n: number | null | undefined) => {
    if (n == null) return "—";
    const v = Number(n);
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}T`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}B`;
    return `${v.toFixed(1)}M`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const signalColor = (s: string) => {
    switch (s) {
      case "buy": return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30";
      case "sell": return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30";
      case "hold": return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30";
      default: return "text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800";
    }
  };

  const changeColor = (n: number | null | undefined) => {
    if (n == null) return "";
    return Number(n) >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  };

  const generateAnalysis = (
    quote: QuoteData | null,
    recs: RecData[],
    metrics: MetricsData | null,
    newsItems: NewsItem[]
  ) => {
    const points: string[] = [];
    if (!quote) return ["No price data available. Add this stock and refresh."];

    const price = Number(quote.price);
    const changePct = Number(quote.change_percent);

    if (changePct > 3) points.push(`Strong upward momentum today (+${changePct.toFixed(2)}%). Consider taking partial profits if you're already in a position.`);
    else if (changePct > 1) points.push(`Positive price action today (+${changePct.toFixed(2)}%). The trend is favorable for holding current positions.`);
    else if (changePct < -3) points.push(`Significant drop today (${changePct.toFixed(2)}%). Evaluate whether this is a buying opportunity or a sign of deeper issues — check the news feed.`);
    else if (changePct < -1) points.push(`Price is down ${changePct.toFixed(2)}% today. Monitor for support levels before adding to positions.`);
    else points.push(`Price is relatively flat today (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%). No strong directional signal from today's price action.`);

    if (metrics) {
      const high52 = Number(metrics.week52_high);
      const low52 = Number(metrics.week52_low);
      if (high52 && low52) {
        const range = high52 - low52;
        const position = range > 0 ? ((price - low52) / range) * 100 : 50;
        if (position > 90) points.push(`Trading near 52-week high (${formatPrice(high52)}). Be cautious about chasing at these levels.`);
        else if (position < 15) points.push(`Near 52-week low (${formatPrice(low52)}). Could be a value opportunity — check fundamentals before buying the dip.`);
        else points.push(`Trading at ${position.toFixed(0)}% of its 52-week range (${formatPrice(low52)} — ${formatPrice(high52)}).`);
      }
      if (metrics.pe_ratio) {
        const pe = Number(metrics.pe_ratio);
        if (pe > 40) points.push(`High P/E ratio (${pe.toFixed(1)}x) — stock is priced for strong growth. Any earnings miss could cause a pullback.`);
        else if (pe > 0 && pe < 15) points.push(`Low P/E ratio (${pe.toFixed(1)}x) — potentially undervalued. Confirm it's not a value trap by checking earnings trend.`);
        else if (pe > 0) points.push(`P/E ratio of ${pe.toFixed(1)}x is in a reasonable range.`);
      }
      if (metrics.beta) {
        const beta = Number(metrics.beta);
        if (beta > 1.5) points.push(`High beta (${beta.toFixed(2)}) — this stock is more volatile than the market. Size your position accordingly.`);
        else if (beta < 0.7) points.push(`Low beta (${beta.toFixed(2)}) — relatively defensive. Good for portfolio stability.`);
      }
    }

    if (recs.length > 0) {
      const r = recs[0];
      const total = Number(r.strong_buy) + Number(r.buy) + Number(r.hold) + Number(r.sell) + Number(r.strong_sell);
      const bullish = Number(r.strong_buy) + Number(r.buy);
      if (total > 0) {
        const pct = ((bullish / total) * 100).toFixed(0);
        if (bullish / total > 0.7) points.push(`Strong analyst consensus: ${pct}% rate Buy/Strong Buy (${total} analysts). Sentiment is bullish.`);
        else if (bullish / total > 0.5) points.push(`Moderate analyst support: ${pct}% rate Buy or better (${total} analysts).`);
        else points.push(`Mixed analyst sentiment: only ${pct}% rate Buy or better (${total} analysts). Proceed with caution.`);
      }
    }

    if (newsItems.length > 10) points.push(`High news volume (${newsItems.length} articles this week) — this stock is getting significant attention. Review headlines for catalysts.`);
    else if (newsItems.length === 0) points.push("No recent news coverage. Low information flow can mean missed signals — monitor closely.");

    return points;
  };

  const initDatabase = async () => {
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      if (res.ok) {
        setError(null);
        await fetchStocks();
        await fetchDashboard();
      }
    } catch {
      setError("Failed to initialize database");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Trading Dashboard
            </h1>
            <p className="text-xs text-zinc-400">
              Portfolio news, prices & signals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchDashboard(); if (selectedStock) { loadStockDetail(selectedStock); loadNews(selectedStock); }}}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Refresh All
            </button>
            <button
              onClick={initDatabase}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition"
            >
              Init DB
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold ml-2">x</button>
          </div>
        )}

        {/* Portfolio overview cards */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Portfolio Overview
            </h2>
            {dashboardLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            )}
          </div>
          {dashboard.length === 0 && !dashboardLoading ? (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-zinc-400">
              No stocks in your portfolio. Add one below to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {dashboard.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => selectStock(s.symbol)}
                  className={`bg-white dark:bg-zinc-900 rounded-lg border p-4 text-left transition hover:shadow-md ${
                    selectedStock === s.symbol
                      ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {s.symbol}
                      </span>
                      {s.name !== s.symbol && (
                        <span className="ml-1.5 text-xs text-zinc-400 truncate max-w-[100px] inline-block align-bottom">
                          {s.name}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${signalColor(s.signal)}`}>
                      {s.signal}
                    </span>
                  </div>
                  {s.quote ? (
                    <>
                      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(s.quote.price)}
                      </div>
                      <div className={`text-sm font-medium ${changeColor(s.quote.change_percent)}`}>
                        {formatPrice(s.quote.change)} ({formatPct(s.quote.change_percent)})
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-zinc-400">Loading...</div>
                  )}
                  {s.recommendation && (
                    <div className="mt-2 flex gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        B:{Number(s.recommendation.strong_buy) + Number(s.recommendation.buy)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        H:{s.recommendation.hold}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        S:{Number(s.recommendation.strong_sell) + Number(s.recommendation.sell)}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Add Stock
              </h2>
              <form onSubmit={addStock} className="space-y-2">
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="Symbol (e.g. AAPL)"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  maxLength={10}
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !newSymbol.trim()}
                  className="w-full px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? "Adding..." : "Add to Portfolio"}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Portfolio ({stocks.length})
              </h2>
              {stocks.length === 0 ? (
                <p className="text-sm text-zinc-400">Empty portfolio.</p>
              ) : (
                <ul className="space-y-0.5">
                  {stocks.map((stock) => (
                    <li
                      key={stock.id}
                      className={`flex items-center justify-between px-2 py-1.5 rounded text-sm transition ${
                        selectedStock === stock.symbol
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <button
                        onClick={() => selectStock(stock.symbol)}
                        className="flex-1 text-left font-medium"
                      >
                        {stock.symbol}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStock(stock.symbol); }}
                        className="text-zinc-300 hover:text-red-500 transition"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {!selectedStock ? (
              <div className="flex items-center justify-center h-80 text-zinc-400 text-sm">
                Select a stock from your portfolio to view details
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="border-b border-zinc-200 dark:border-zinc-800 px-4">
                  <div className="flex gap-4">
                    {(["overview", "news", "analysis"] as Tab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 text-sm font-medium border-b-2 transition capitalize ${
                          activeTab === tab
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    detailLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Price header */}
                        {detailQuote && (
                          <div>
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                                {formatPrice(detailQuote.price)}
                              </span>
                              <span className={`text-lg font-medium ${changeColor(detailQuote.change_percent)}`}>
                                {formatPrice(detailQuote.change)} ({formatPct(detailQuote.change_percent)})
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { label: "Open", value: formatPrice(detailQuote.open_price) },
                                { label: "Prev Close", value: formatPrice(detailQuote.prev_close) },
                                { label: "Day High", value: formatPrice(detailQuote.high) },
                                { label: "Day Low", value: formatPrice(detailQuote.low) },
                              ].map((item) => (
                                <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-2.5">
                                  <div className="text-[11px] text-zinc-400 uppercase">{item.label}</div>
                                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key metrics */}
                        {detailMetrics && (
                          <div>
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Key Metrics</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { label: "52W High", value: formatPrice(detailMetrics.week52_high) },
                                { label: "52W Low", value: formatPrice(detailMetrics.week52_low) },
                                { label: "P/E Ratio", value: detailMetrics.pe_ratio != null ? Number(detailMetrics.pe_ratio).toFixed(1) : "—" },
                                { label: "EPS", value: detailMetrics.eps != null ? `$${Number(detailMetrics.eps).toFixed(2)}` : "—" },
                                { label: "Beta", value: detailMetrics.beta != null ? Number(detailMetrics.beta).toFixed(2) : "—" },
                                { label: "Div Yield", value: detailMetrics.dividend_yield != null ? `${Number(detailMetrics.dividend_yield).toFixed(2)}%` : "—" },
                                { label: "Mkt Cap", value: formatLargeNum(detailMetrics.market_cap) },
                                { label: "Avg Vol (10d)", value: detailMetrics.avg_volume != null ? `${Number(detailMetrics.avg_volume).toFixed(1)}M` : "—" },
                              ].map((item) => (
                                <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-2.5">
                                  <div className="text-[11px] text-zinc-400 uppercase">{item.label}</div>
                                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Analyst recommendations */}
                        {detailRecs.length > 0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Analyst Recommendations</h3>
                            <div className="space-y-2">
                              {detailRecs.map((r) => {
                                const total = Number(r.strong_buy) + Number(r.buy) + Number(r.hold) + Number(r.sell) + Number(r.strong_sell);
                                return (
                                  <div key={r.period} className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-3">
                                    <div className="text-xs text-zinc-400 mb-2">{r.period}</div>
                                    <div className="flex gap-1 h-5 rounded overflow-hidden">
                                      {total > 0 && (
                                        <>
                                          <div style={{ width: `${(Number(r.strong_buy) / total) * 100}%` }} className="bg-emerald-600" title={`Strong Buy: ${r.strong_buy}`} />
                                          <div style={{ width: `${(Number(r.buy) / total) * 100}%` }} className="bg-emerald-400" title={`Buy: ${r.buy}`} />
                                          <div style={{ width: `${(Number(r.hold) / total) * 100}%` }} className="bg-amber-400" title={`Hold: ${r.hold}`} />
                                          <div style={{ width: `${(Number(r.sell) / total) * 100}%` }} className="bg-red-400" title={`Sell: ${r.sell}`} />
                                          <div style={{ width: `${(Number(r.strong_sell) / total) * 100}%` }} className="bg-red-600" title={`Strong Sell: ${r.strong_sell}`} />
                                        </>
                                      )}
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-zinc-400">
                                      <span>Strong Buy: {r.strong_buy} | Buy: {r.buy}</span>
                                      <span>Hold: {r.hold}</span>
                                      <span>Sell: {r.sell} | Strong Sell: {r.strong_sell}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* News Tab */}
                  {activeTab === "news" && (
                    newsLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : news.length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-12">
                        No news found for {selectedStock} in the last 7 days.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {news.map((item) => (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition group"
                          >
                            <div className="flex gap-3">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt=""
                                  className="w-20 h-20 object-cover rounded flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                                  {item.headline}
                                </h3>
                                {item.summary && (
                                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{item.summary}</p>
                                )}
                                <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
                                  <span>{item.source}</span>
                                  <span>&#183;</span>
                                  <span>{formatDate(item.published_at)}</span>
                                </div>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )
                  )}

                  {/* Analysis Tab */}
                  {activeTab === "analysis" && (
                    detailLoading || newsLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                            Daily Analysis — {selectedStock}
                          </h3>
                          <p className="text-xs text-zinc-400 mb-4">
                            Based on current price, analyst consensus, fundamentals, and news activity
                          </p>
                        </div>

                        {/* Signal badge */}
                        {(() => {
                          const ds = dashboard.find((d) => d.symbol === selectedStock);
                          return ds ? (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${signalColor(ds.signal)}`}>
                              <span className="uppercase text-xs tracking-wider">Signal:</span>
                              <span className="text-base font-bold uppercase">{ds.signal}</span>
                            </div>
                          ) : null;
                        })()}

                        <div className="space-y-3">
                          {generateAnalysis(detailQuote, detailRecs, detailMetrics, news).map((point, i) => (
                            <div key={i} className="flex gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                              <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{i + 1}</span>
                              </div>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{point}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            This analysis is generated from publicly available data and analyst ratings. It is not financial advice. Always do your own research before making trading decisions.
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
