import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { orders, type Order, type OrderItem, type OrderStatus } from "../lib/store.js";
import { broadcast } from "../lib/ws.js";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "served"],
  preparing: ["ready", "served"],
  ready: ["served"],
  served: [],
};

const STATUS_LABELS: Record<OrderStatus, { en: string; tr: string }> = {
  received:  { en: "Order received",    tr: "Sipariş alındı" },
  preparing: { en: "Being prepared",    tr: "Hazırlanıyor" },
  ready:     { en: "Ready to serve",    tr: "Servis için hazır" },
  served:    { en: "Served",            tr: "Servis edildi" },
};

const router: IRouter = Router();

router.post("/", (req: Request, res: Response) => {
  const { restaurantId, tableNumber, items, guestName } = req.body as {
    restaurantId?: string;
    tableNumber?: string | number;
    items?: OrderItem[];
    guestName?: string;
  };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (tableNumber === undefined || tableNumber === null) {
    res.status(400).json({ success: false, error: "tableNumber is required" });
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: "items must be a non-empty array" });
    return;
  }

  const orderId = randomUUID();
  const estimatedMinutes = 20 + items.length * 3;
  const now = new Date().toISOString();

  const order: Order = {
    orderId,
    restaurantId,
    tableNumber,
    items,
    guestName: guestName ?? undefined,
    status: "received",
    statusHistory: [{ status: "received", changedAt: now }],
    createdAt: now,
    estimatedMinutes,
  };

  orders.set(orderId, order);
  req.log.info({ orderId, restaurantId, tableNumber }, "order placed");
  broadcast("order:created", order);

  res.status(201).json({
    success: true,
    data: {
      orderId,
      status: "received",
      estimatedMinutes,
      message: `Your order has been received. Estimated wait time: ${estimatedMinutes} minutes.`,
      messageTr: `Siparişiniz alındı. Tahmini bekleme süresi: ${estimatedMinutes} dakika.`,
      order,
    },
  });
});

router.patch("/:orderId/status", (req: Request, res: Response) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }

  const { status } = req.body as { status?: OrderStatus };

  if (!status) {
    res.status(400).json({ success: false, error: "status is required" });
    return;
  }

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    res.status(422).json({
      success: false,
      error: `Cannot transition from "${order.status}" to "${status}". Allowed: [${allowed.join(", ") || "none — order is already served"}]`,
    });
    return;
  }

  const previousStatus = order.status;
  const now = new Date().toISOString();

  order.status = status;
  order.statusHistory.push({ status, changedAt: now });
  orders.set(order.orderId, order);
  broadcast("order:updated", { orderId: order.orderId, status, previousStatus, order });

  req.log.info(
    { orderId: order.orderId, from: previousStatus, to: status },
    "order status updated",
  );

  res.json({
    success: true,
    data: {
      orderId: order.orderId,
      previousStatus,
      status,
      label: STATUS_LABELS[status],
      changedAt: now,
      statusHistory: order.statusHistory,
      order,
    },
  });
});

router.get("/:orderId", (req: Request, res: Response) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }
  res.json({ success: true, data: order });
});

router.get("/", (req: Request, res: Response) => {
  const { restaurantId, status, tableNumber } = req.query as {
    restaurantId?: string;
    status?: string;
    tableNumber?: string;
  };

  let result = Array.from(orders.values());

  if (restaurantId) result = result.filter((o) => o.restaurantId === restaurantId);
  if (status) result = result.filter((o) => o.status === status);
  if (tableNumber) result = result.filter((o) => String(o.tableNumber) === tableNumber);

  result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  res.json({ success: true, data: result, total: result.length });
});

/* ── GARSON / HESAP CALL NOTIFICATION ───────────────── */
router.post("/notify", async (req: Request, res: Response) => {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const { masaId, type } = req.body as { masaId?: string; type?: string };
  const display = String(masaId ?? "?").replace(/^masa-/i, "");
  const time    = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  if (!token || !chatId) {
    req.log.warn("Telegram not configured for notify");
    res.status(503).json({ success: false, error: "Telegram not configured" });
    return;
  }

  let text: string;
  if (type === "garson") {
    text = `🔔 *GARSON ÇAĞRISI*\n\n📍 Masa: *${display}*\n⏰ ${time}\nMüşteri garson bekliyor.`;
  } else if (type === "hesap") {
    text = `💳 *ADİSYON TALEBİ*\n\n📍 Masa: *${display}*\n⏰ ${time}`;
  } else {
    res.status(400).json({ success: false, error: "type must be 'garson' or 'hesap'" });
    return;
  }

  try {
    const tgRes  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    const tgData = (await tgRes.json()) as { ok: boolean; description?: string };
    if (tgData.ok) {
      req.log.info({ masaId: display, type }, "call notification sent");
      res.json({ success: true });
    } else {
      res.status(502).json({ success: false, error: tgData.description ?? "Telegram error" });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    res.status(500).json({ success: false, error: msg });
  }
});

/* ── TELEGRAM NOTIFICATION ───────────────────────────── */
router.post("/telegram", async (req: Request, res: Response) => {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    req.log.warn("Telegram not configured — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
    res.status(503).json({ success: false, error: "Telegram not configured" });
    return;
  }

  const { masaId, items } = req.body as {
    masaId?: string;
    items?: Array<{ dishId?: string; name?: string; dishName?: string; quantity?: number; unitPrice?: number }>;
  };

  if (!masaId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: "masaId and items are required" });
    return;
  }

  const displayMasa = String(masaId).replace(/^masa-/i, "");
  let total = 0;
  let text  = `🍺 *Rebel Bar & Bistro — Yeni Sipariş*\n\n`;
  text     += `📍 Masa: *${displayMasa}*\n\n`;
  text     += `*Ürünler:*\n`;

  for (const item of items) {
    const qty  = Number(item.quantity ?? 1);
    const unit = Number(item.unitPrice ?? 0);
    const sub  = qty * unit;
    total += sub;
    text += `• ${item.dishName ?? item.name ?? item.dishId} ×${qty} — ${sub.toLocaleString("tr-TR")} ₺\n`;
  }

  text += `\n💰 *Toplam: ${total.toLocaleString("tr-TR")} ₺*`;
  text += `\n⏰ ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });

    const tgData = (await tgRes.json()) as { ok: boolean; description?: string };

    if (tgData.ok) {
      req.log.info({ masaId: displayMasa }, "telegram order notification sent");
      res.json({ success: true });
    } else {
      req.log.error({ description: tgData.description }, "telegram API error");
      res.status(502).json({ success: false, error: tgData.description ?? "Telegram error" });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    req.log.error({ err: msg }, "telegram fetch failed");
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
