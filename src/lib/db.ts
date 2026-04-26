import { neon } from "@neondatabase/serverless";

function getClient() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
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
  await sql`DELETE FROM news WHERE stock_symbol = ${symbol.toUpperCase()}`;
  await sql`DELETE FROM news_fetch_log WHERE stock_symbol = ${symbol.toUpperCase()}`;
  return sql`DELETE FROM stocks WHERE symbol = ${symbol.toUpperCase()} RETURNING *`;
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
