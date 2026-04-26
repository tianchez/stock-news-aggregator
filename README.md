# Stock News Aggregator

A Next.js web app that lets you track stock tickers and view their latest news from Finnhub, deployed on Vercel.

## Features

- Add/view/delete stock tickers (stored in Neon Postgres)
- Fetches latest 7-day news from Finnhub API
- Caches news in database — skips API call if last fetch was < 1 hour ago
- Clean, responsive UI with Tailwind CSS

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- **DATABASE_URL**: Neon Postgres connection string. Add a Neon Postgres integration from [Vercel Marketplace](https://vercel.com/marketplace) or create a database at [neon.tech](https://neon.tech).
- **FINNHUB_API_KEY**: Get a free API key at [finnhub.io/register](https://finnhub.io/register).

### 2. Initialize Database

After deploying (or running locally), click the "Reset DB" button in the app header to create the required tables. Or call `POST /api/setup`.

### 3. Run Locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
vercel --prod
```

Set `DATABASE_URL` and `FINNHUB_API_KEY` in Vercel project environment variables.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/setup` | Initialize database tables |
| GET | `/api/stocks` | List all tracked stocks |
| POST | `/api/stocks` | Add a stock (`{symbol, name}`) |
| DELETE | `/api/stocks/[symbol]` | Remove a stock |
| GET | `/api/news/[symbol]` | Get news (auto-caches, refreshes if > 1h old) |
