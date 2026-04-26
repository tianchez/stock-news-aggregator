"use client";

import { useState, useEffect, useCallback } from "react";

interface Stock {
  id: number;
  symbol: string;
  name: string;
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

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsSource, setNewsSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState(true);

  const initDatabase = async () => {
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      if (res.ok) setDbReady(true);
    } catch {
      setError("Failed to initialize database");
    }
  };

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      if (res.ok) {
        setStocks(await res.json());
      }
    } catch {
      setError("Failed to load stocks");
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

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
      }
    } catch {
      setError("Failed to delete stock");
    }
  };

  const fetchNews = async (symbol: string) => {
    setSelectedStock(symbol);
    setNewsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news);
        setNewsSource(data.source === "api" ? "Fetched fresh from Finnhub" : "Loaded from cache");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load news");
      }
    } catch {
      setError("Failed to load news");
    } finally {
      setNewsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Database Setup Required</h1>
          <p className="text-zinc-500">Click below to initialize the database tables.</p>
          <button
            onClick={initDatabase}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Initialize Database
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Stock News Aggregator
          </h1>
          <button
            onClick={initDatabase}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition"
          >
            Reset DB
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">
              x
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left sidebar: Stock picker */}
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
                  placeholder="Name (e.g. Apple Inc.)"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !newSymbol.trim()}
                  className="w-full px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? "Adding..." : "Add Stock"}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Watched Stocks
              </h2>
              {stocks.length === 0 ? (
                <p className="text-sm text-zinc-400">No stocks added yet.</p>
              ) : (
                <ul className="space-y-1">
                  {stocks.map((stock) => (
                    <li
                      key={stock.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition ${
                        selectedStock === stock.symbol
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <button
                        onClick={() => fetchNews(stock.symbol)}
                        className="flex-1 text-left"
                      >
                        <span className="font-medium">{stock.symbol}</span>
                        {stock.name !== stock.symbol && (
                          <span className="ml-2 text-zinc-400 text-xs">
                            {stock.name}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStock(stock.symbol);
                        }}
                        className="ml-2 text-zinc-400 hover:text-red-500 transition"
                        title="Remove stock"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: News feed */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            {!selectedStock ? (
              <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
                Select a stock to view its latest news
              </div>
            ) : newsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedStock} News
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">{newsSource}</span>
                    <button
                      onClick={() => fetchNews(selectedStock)}
                      className="text-xs text-blue-600 hover:text-blue-700 transition"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                {news.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-12">
                    No news found for {selectedStock} in the last 7 days.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {news.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition group"
                      >
                        <div className="flex gap-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                              {item.headline}
                            </h3>
                            {item.summary && (
                              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                                {item.summary}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                              <span>{item.source}</span>
                              <span>&#183;</span>
                              <span>{formatDate(item.published_at)}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
