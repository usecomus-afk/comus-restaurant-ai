# Comus — AI-Powered Restaurant CRM

## Overview

Comus is an AI-powered restaurant CRM REST API built with Node.js + Express + GPT-4o-mini. It provides a full restaurant operations backend with multilingual AI chat, menu management, order pipeline, CRM, reservations, stock control, feedback/crisis alerting, business analytics, and a real-time admin dashboard served directly from the API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **WebSocket**: `ws` (real-time push to dashboard)
- **AI**: OpenAI GPT-4o-mini (via `openai` SDK)
- **Database**: PostgreSQL + Drizzle ORM (available, currently unused — state is in-memory)
- **Build**: esbuild (ESM bundle, static assets copied post-build)

## Routes & Proxy

- `/api/*` → API server (port 8080)
- `/admin` → Operations Dashboard (static HTML SPA, served by Express)
- `/ws` → WebSocket endpoint (real-time push events)

## API Endpoints

All REST routes are prefixed with `/api`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/chat` | AI chat — GPT-4o-mini maître d', multilingual, stock-aware |
| `GET` | `/api/menu/:restaurantId` | Menu data (Turkish fine dining, 5 dishes) |
| `POST` | `/api/menu/update` | Natural language AI menu editing (`{restaurantId, message}`) |
| `POST` | `/api/order` | Place order |
| `GET` | `/api/order` | List orders (filter by `restaurantId`, `status`, `tableNumber`) |
| `GET` | `/api/order/:orderId` | Get single order |
| `PATCH` | `/api/order/:orderId/status` | Advance order: received→preparing→ready→served |
| `POST` | `/api/notify` | Send staff notification |
| `GET` | `/api/notify` | List notification log |
| `POST` | `/api/reservation` | Create a reservation |
| `GET` | `/api/reservation` | List reservations (filter by `restaurantId`, `date`, `status`) |
| `GET` | `/api/reservation/:reservationId` | Get a single reservation |
| `PATCH` | `/api/reservation/:reservationId` | Update reservation details or status |
| `DELETE` | `/api/reservation/:reservationId` | Delete a reservation |
| `POST` | `/api/stock` | Mark a dish available or out of stock |
| `GET` | `/api/stock` | List stock records (filter by `restaurantId`, `available`) |
| `GET` | `/api/stock/:dishId` | Check availability of a single dish |
| `POST` | `/api/feedback` | Submit feedback → AI response + crisis/celebration alert |
| `GET` | `/api/feedback` | List feedback (filter by `restaurantId`, `minRating`, `maxRating`, `crisis=true`) |
| `GET` | `/api/feedback/:feedbackId` | Get single feedback record |
| `POST` | `/api/customer` | Create a CRM customer profile |
| `GET` | `/api/customer` | List customers (filter by `restaurantId`, search by name/phone/email) |
| `GET` | `/api/customer/:customerId` | Get a single customer |
| `PATCH` | `/api/customer/:customerId` | Update customer details |
| `POST` | `/api/customer/:customerId/visit` | Record a visit to customer history |
| `DELETE` | `/api/customer/:customerId` | Delete a customer |
| `GET` | `/api/analytics/:restaurantId` | BI report: KPIs, trends, peak hours, ghost menu (AI), missing menu (AI), top complaints (AI) |

## WebSocket Events (pushed to `/ws` clients)

| Event | Trigger |
|-------|---------|
| `order:created` | New order placed |
| `order:updated` | Order status advanced |
| `reservation:created` | New reservation |
| `reservation:updated` | Reservation updated |
| `feedback:new` | Feedback submitted |
| `stock:updated` | Dish availability changed |

The admin dashboard connects to WebSocket on load, handles all events to update sections without a full reload, and auto-reconnects on disconnect. Falls back to polling every 60 seconds.

## Admin Dashboard

Located at `/admin` — a single-file HTML/CSS/JS SPA served by Express static middleware. Features:
- **Orders tab**: live order table with status badges + one-click advance buttons
- **Reservations tab**: filterable by date and status
- **Customers tab**: searchable CRM card grid with allergy/preference pills
- **Stock tab**: dish availability grid + full menu cross-reference table
- **Feedback tab**: crisis (🚨) and celebration (🎉) alerts with AI responses, filterable
- **Analytics tab**: KPI row, Chart.js charts (weekly orders + rating trend), ghost menu, missing menu, top complaints

## State Architecture

All in-memory state lives in `artifacts/api-server/src/lib/store.ts`:
- `orders` — `Map<string, Order>`
- `customers` — `Map<string, Customer>`
- `reservations` — `Map<string, Reservation>`
- `notifications` — `Notification[]` (sequential IDs: NOTIF-0001, NOTIF-0002…)
- `stock` — `Map<"restaurantId:dishId", StockItem>`
- `menus` — `Map<string, Menu>` (seeded with Turkish fine dining default)
- `feedbacks` — `Map<string, Feedback>`
- `chatLog` — `ChatEntry[]` (logged per restaurant for analytics)

## Environment Variables / Secrets

- `OPENAI_API_KEY` — Required for `/api/chat`, `/api/menu/update`, `/api/feedback`, `/api/analytics`
- `SESSION_SECRET` — Available
- `PORT` — Set by Replit (defaults to 8080)

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — rebuild + start API server
- `pnpm --filter @workspace/api-server run typecheck` — TypeScript check

## Important Source Files

```
artifacts/api-server/
  src/
    app.ts               — Express app + static /admin route
    index.ts             — HTTP server + WebSocket upgrade handler
    lib/
      store.ts           — All in-memory state + createNotification factory
      ws.ts              — WebSocket server + broadcast() function
      logger.ts          — Pino logger
    routes/
      index.ts           — Router registration (menu/update BEFORE menu/:id)
      chat.ts            — AI chat (stock-aware, menu-aware, logs to chatLog)
      menu.ts            — GET /menu/:restaurantId
      menu-update.ts     — POST /menu/update (AI natural language parser)
      order.ts           — Full order CRUD + status pipeline + WS broadcast
      reservation.ts     — Full reservation CRUD + WS broadcast
      customer.ts        — Full customer CRUD + visit recording
      stock.ts           — Dish availability tracking + WS broadcast
      notify.ts          — Staff notifications
      feedback.ts        — AI response + crisis/celebration detection + WS broadcast
      analytics.ts       — BI report with AI ghost/missing menu + complaints
    public/
      admin.html         — Single-file admin dashboard SPA
  build.mjs              — esbuild bundler (copies src/public → dist/public)
```
