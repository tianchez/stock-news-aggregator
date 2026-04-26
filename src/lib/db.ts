import { neon } from "@neondatabase/serverless";

function getClient() {
  return neon(process.env.DATABASE_URL!);
}

export async function initDb() {
  const sql = getClient();
  await sql`
    CREATE TABLE IF NOT EXISTS stocks (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      stock_symbol VARCHAR(10) NOT NULL,
      headline TEXT NOT NULL,
      summary TEXT,
      source VARCHAR(255),
      url TEXT,
      image_url TEXT,
      published_at TIMESTAMP,
      finnhub_id BIGINT UNIQUE,
      fetched_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS news_fetch_log (
      id SERIAL PRIMARY KEY,
      stock_symbol VARCHAR(10) NOT NULL UNIQUE,
      last_fetched_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      stock_symbol VARCHAR(10) NOT NULL,
      price NUMERIC,
      change NUMERIC,
      change_percent NUMERIC,
      high NUMERIC,
      low NUMERIC,
      open_price NUMERIC,
      prev_close NUMERIC,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(stock_symbol)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS recommendations (
      id SERIAL PRIMARY KEY,
      stock_symbol VARCHAR(10) NOT NULL,
      strong_buy INT DEFAULT 0,
      buy INT DEFAULT 0,
      hold INT DEFAULT 0,
      sell INT DEFAULT 0,
      strong_sell INT DEFAULT 0,
      period VARCHAR(20),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(stock_symbol, period)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      stock_symbol VARCHAR(10) NOT NULL UNIQUE,
      week52_high NUMERIC,
      week52_low NUMERIC,
      beta NUMERIC,
      pe_ratio NUMERIC,
      eps NUMERIC,
      dividend_yield NUMERIC,
      market_cap NUMERIC,
      avg_volume NUMERIC,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getStocks() {
  const sql = getClient();
  return sql`SELECT * FROM stocks ORDER BY created_at DESC`;
}

export async function addStock(symbol: string, name: string) {
  const sql = getClient();
  return sql`
    INSERT INTO stocks (symbol, name)
    VALUES (${symbol.toUpperCase()}, ${name})
    ON CONFLICT (symbol) DO NOTHING
    RETURNING *
  `;
}

export async function deleteStock(symbol: string) {
  const sql = getClient();
  const upper = symbol.toUpperCase();
  await sql`DELETE FROM news WHERE stock_symbol = ${upper}`;
  await sql`DELETE FROM news_fetch_log WHERE stock_symbol = ${upper}`;
  await sql`DELETE FROM quotes WHERE stock_symbol = ${upper}`;
  await sql`DELETE FROM recommendations WHERE stock_symbol = ${upper}`;
  await sql`DELETE FROM metrics WHERE stock_symbol = ${upper}`;
  return sql`DELETE FROM stocks WHERE symbol = ${upper} RETURNING *`;
}

export async function getLastFetchTime(symbol: string) {
  const sql = getClient();
  const rows = await sql`
    SELECT last_fetched_at FROM news_fetch_log
    WHERE stock_symbol = ${symbol.toUpperCase()}
  `;
  return rows.length > 0 ? new Date(rows[0].last_fetched_at) : null;
}

export async function updateFetchTime(symbol: string) {
  const sql = getClient();
  await sql`
    INSERT INTO news_fetch_log (stock_symbol, last_fetched_at)
    VALUES (${symbol.toUpperCase()}, NOW())
    ON CONFLICT (stock_symbol) DO UPDATE SET last_fetched_at = NOW()
  `;
}

export async function getNewsFromDb(symbol: string) {
  const sql = getClient();
  return sql`
    SELECT * FROM news
    WHERE stock_symbol = ${symbol.toUpperCase()}
    AND published_at >= NOW() - INTERVAL '7 days'
    ORDER BY published_at DESC
  `;
}

export interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
  id: number;
}

export async function saveNews(symbol: string, articles: NewsArticle[]) {
  const sql = getClient();
  for (const article of articles) {
    await sql`
      INSERT INTO news (stock_symbol, headline, summary, source, url, image_url, published_at, finnhub_id)
      VALUES (
        ${symbol.toUpperCase()},
        ${article.headline},
        ${article.summary},
        ${article.source},
        ${article.url},
        ${article.image},
        ${new Date(article.datetime * 1000).toISOString()},
        ${article.id}
      )
      ON CONFLICT (finnhub_id) DO NOTHING
    `;
  }
}

export async function saveQuote(
  symbol: string,
  q: { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number }
) {
  const sql = getClient();
  await sql`
    INSERT INTO quotes (stock_symbol, price, change, change_percent, high, low, open_price, prev_close, updated_at)
    VALUES (${symbol.toUpperCase()}, ${q.c}, ${q.d}, ${q.dp}, ${q.h}, ${q.l}, ${q.o}, ${q.pc}, NOW())
    ON CONFLICT (stock_symbol) DO UPDATE SET
      price = ${q.c}, change = ${q.d}, change_percent = ${q.dp},
      high = ${q.h}, low = ${q.l}, open_price = ${q.o}, prev_close = ${q.pc},
      updated_at = NOW()
  `;
}

export async function getQuote(symbol: string) {
  const sql = getClient();
  const rows = await sql`SELECT * FROM quotes WHERE stock_symbol = ${symbol.toUpperCase()}`;
  return rows[0] || null;
}

export async function getQuoteUpdatedAt(symbol: string) {
  const sql = getClient();
  const rows = await sql`SELECT updated_at FROM quotes WHERE stock_symbol = ${symbol.toUpperCase()}`;
  return rows.length > 0 ? new Date(rows[0].updated_at) : null;
}

export async function saveRecommendations(
  symbol: string,
  recs: Array<{
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    period: string;
  }>
) {
  const sql = getClient();
  for (const r of recs.slice(0, 3)) {
    await sql`
      INSERT INTO recommendations (stock_symbol, strong_buy, buy, hold, sell, strong_sell, period, updated_at)
      VALUES (${symbol.toUpperCase()}, ${r.strongBuy}, ${r.buy}, ${r.hold}, ${r.sell}, ${r.strongSell}, ${r.period}, NOW())
      ON CONFLICT (stock_symbol, period) DO UPDATE SET
        strong_buy = ${r.strongBuy}, buy = ${r.buy}, hold = ${r.hold},
        sell = ${r.sell}, strong_sell = ${r.strongSell}, updated_at = NOW()
    `;
  }
}

export async function getRecommendations(symbol: string) {
  const sql = getClient();
  return sql`
    SELECT * FROM recommendations
    WHERE stock_symbol = ${symbol.toUpperCase()}
    ORDER BY period DESC
    LIMIT 3
  `;
}

export async function saveMetrics(
  symbol: string,
  m: {
    week52High?: number;
    week52Low?: number;
    beta?: number;
    pe?: number;
    eps?: number;
    dividendYield?: number;
    marketCap?: number;
    avgVolume?: number;
  }
) {
  const sql = getClient();
  await sql`
    INSERT INTO metrics (stock_symbol, week52_high, week52_low, beta, pe_ratio, eps, dividend_yield, market_cap, avg_volume, updated_at)
    VALUES (${symbol.toUpperCase()}, ${m.week52High ?? null}, ${m.week52Low ?? null}, ${m.beta ?? null},
            ${m.pe ?? null}, ${m.eps ?? null}, ${m.dividendYield ?? null}, ${m.marketCap ?? null}, ${m.avgVolume ?? null}, NOW())
    ON CONFLICT (stock_symbol) DO UPDATE SET
      week52_high = ${m.week52High ?? null}, week52_low = ${m.week52Low ?? null},
      beta = ${m.beta ?? null}, pe_ratio = ${m.pe ?? null}, eps = ${m.eps ?? null},
      dividend_yield = ${m.dividendYield ?? null}, market_cap = ${m.marketCap ?? null},
      avg_volume = ${m.avgVolume ?? null}, updated_at = NOW()
  `;
}

export async function getMetrics(symbol: string) {
  const sql = getClient();
  const rows = await sql`SELECT * FROM metrics WHERE stock_symbol = ${symbol.toUpperCase()}`;
  return rows[0] || null;
}
