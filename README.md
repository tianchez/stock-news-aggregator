# Stock News Aggregator - Personal Trading Dashboard

A personal day trading dashboard that pulls together stock prices, news, analyst recommendations, and trading signals into one place. Built to save time collecting scattered information across multiple platforms and support faster investing decisions.

**Live:** [tz2628-stock-news-aggregator.vercel.app](https://tz2628-stock-news-aggregator.vercel.app)

![Trading Dashboard — GOOGL Overview](public/screenshot-dashboard.png)

## What It Does

Day trading requires monitoring multiple sources of information: stock prices, breaking news, analyst ratings, financial metrics. This tool consolidates everything for the stocks in your portfolio into a single dashboard so you can review and act quickly.

### Core Features

- **Portfolio Management** — Add and remove stock tickers to build your personal watchlist. All selections persist in the database across sessions.

- **Real-Time Stock Prices** — Live quotes showing current price, daily change ($ and %), open, close, high, low. Quotes are cached for 5 minutes to stay within free API limits.

- **News Aggregation** — Latest 7 days of company-specific news headlines from major financial sources. News is cached in the database for 1 hour — if data is fresh, it loads instantly from the cache instead of calling the API.

- **Analyst Recommendations** — Visual breakdown of Wall Street analyst consensus: Strong Buy, Buy, Hold, Sell, Strong Sell with stacked bar charts for the last 3 months.

- **Key Financial Metrics** — 52-week high/low, P/E ratio, EPS, beta, dividend yield, market cap, and average trading volume.

- **Daily Trading Analysis** — Automated analysis combining price momentum, 52-week positioning, P/E valuation, analyst consensus, and news activity into actionable bullet points. Each stock gets a simple signal: BUY, HOLD, SELL, or NEUTRAL.

### How the Caching Works

To avoid hammering APIs and stay within free tier limits:
- **Stock quotes & metrics**: cached 5 minutes in Postgres. Fresh data fetched from Finnhub only when cache expires.
- **News articles**: cached 1 hour. Articles stored with unique Finnhub IDs to prevent duplicates.
- Dashboard shows whether data came from the cache or was freshly fetched.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) | Full-stack React framework with API routes, server components, and optimized production builds. Deploys natively to Vercel. |
| **Language** | TypeScript | Type safety across frontend and backend code. Catches bugs at build time. |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) | Utility-first CSS for rapid, consistent UI development. Dark mode support built in. |
| **Database** | [Neon Postgres](https://neon.tech) (serverless) | Serverless PostgreSQL that works with Vercel's edge/serverless functions. Scales to zero when idle (free tier). Uses the `@neondatabase/serverless` driver for HTTP-based queries. |
| **Stock Data API** | [Finnhub](https://finnhub.io) | Free tier with 60 requests/minute. Provides stock quotes, company news, analyst recommendations, and financial metrics through a simple REST API. |
| **Deployment** | [Vercel](https://vercel.com) | Zero-config deployment for Next.js. Automatic preview deploys, edge network, and native Neon Postgres integration. |

### Architecture

```
Browser (React SPA)
  |
  |-- GET /api/dashboard      --> fetch all portfolio quotes + signals
  |-- GET /api/quote/[symbol]  --> price, metrics, recommendations (5min cache)
  |-- GET /api/news/[symbol]   --> 7-day news feed (1hr cache)
  |-- POST/GET/DELETE /api/stocks --> portfolio CRUD
  |
  v
Next.js API Routes (serverless functions)
  |
  |-- Neon Postgres (cache + persistence)
  |-- Finnhub REST API (external data source)
```

## Setup

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) database (free tier)
- A [Finnhub](https://finnhub.io/register) API key (free tier)

### 1. Clone and Install

```bash
git clone https://github.com/tianchez/stock-news-aggregator.git
cd stock-news-aggregator
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
FINNHUB_API_KEY=your_api_key_here
```

### 3. Initialize Database

Start the app and click **"Init DB"** in the header, or:

```bash
curl -X POST http://localhost:3000/api/setup
```

This creates 6 tables: `stocks`, `news`, `news_fetch_log`, `quotes`, `recommendations`, `metrics`.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set `DATABASE_URL` and `FINNHUB_API_KEY` as environment variables in your Vercel project settings.

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/setup` | Create all database tables |
| `GET` | `/api/stocks` | List portfolio stocks |
| `POST` | `/api/stocks` | Add stock `{ symbol, name }` |
| `DELETE` | `/api/stocks/[symbol]` | Remove stock and all its data |
| `GET` | `/api/dashboard` | All stocks with quotes + signals |
| `GET` | `/api/quote/[symbol]` | Price, metrics, recommendations |
| `GET` | `/api/news/[symbol]` | 7-day news (1hr cache) |

## License

MIT
