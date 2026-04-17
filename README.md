# Rebel Bar & Bistro — Comus Restaurant AI

  AI-powered restaurant CRM REST API built with Node.js, Express, and GPT-4o-mini.

  ## Features
  - Mobile-first guest menu at `/m/:masaId`
  - 66-item menu with cart + Telegram order notifications
  - Masa (table) selector
  - AI chat assistant
  - Telegram bot for natural-language menu management (price updates, availability, daily specials)
  - KVKK compliance

  ## Stack
  - **Runtime**: Node.js + Express + TypeScript
  - **AI**: OpenAI GPT-4o-mini
  - **Notifications**: Telegram Bot API
  - **Build**: esbuild (ESM output)
  - **Package manager**: pnpm monorepo

  ## Environment Variables
  | Variable | Description |
  |---|---|
  | `PORT` | Server port (auto-set by Railway) |
  | `NODE_ENV` | Set to `production` |
  | `OPENAI_API_KEY` | OpenAI API key |
  | `TELEGRAM_BOT_TOKEN` | Telegram bot token |
  | `TELEGRAM_CHAT_ID` | Telegram group chat ID for order notifications |

  ## Deploy to Railway
  See `.env.example` and `railway.json` for configuration.

  After deploying, call `POST /api/telegram/setup` to register the Telegram webhook with the new domain.
  