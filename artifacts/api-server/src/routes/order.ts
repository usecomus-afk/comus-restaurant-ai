import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { orders, type Order, type OrderItem, type OrderStatus } from "../lib/store.js";
import { broadcast } from "../lib/ws.js";
import { dbLogOrder } from "../lib/supabaseDb.js";
import {
  normalizeOrderItems,
  sendOrderNotification,
  sendServiceRequestNotification,
} from "../lib/telegram.js";

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
  dbLogOrder(order);
  req.log.info({ orderId, restaurantId, tableNumber }, "order placed");
  broadcast("order:created", order);

  sendOrderNotification(tableNumber, normalizeOrderItems(items as unknown[])).then((result) => {
    if (!result.ok) {
      req.log.error({ error: result.error, orderId }, "failed to send telegram order notification");
    }
  });

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
  const { masaId, tableNumber, type } = req.body as {
    masaId?: string | number;
    tableNumber?: string | number;
    type?: string;
  };
  const effectiveTable = tableNumber ?? masaId ?? "?";
  if (type !== "garson" && type !== "hesap") {
    res.status(400).json({ success: false, error: "type must be 'garson' or 'hesap'" });
    return;
  }

  const result = await sendServiceRequestNotification(effectiveTable, type);
  if (result.ok) {
    req.log.info({ tableNumber: effectiveTable, type }, "call notification sent");
    res.json({ success: true });
    return;
  }

  res.status(500).json({ success: false, error: result.error ?? "Telegram error" });
});

/* ── TELEGRAM NOTIFICATION ───────────────────────────── */
router.post("/telegram", async (req: Request, res: Response) => {
  const { masaId, items } = req.body as {
    masaId?: string;
    items?: Array<{ dishId?: string; name?: string; dishName?: string; quantity?: number; unitPrice?: number }>;
  };

  if (!masaId || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: "masaId and items are required" });
    return;
  }

  const result = await sendOrderNotification(masaId, normalizeOrderItems(items as unknown[]));
  if (result.ok) {
    req.log.info({ masaId }, "telegram order notification sent");
    res.json({ success: true });
    return;
  }

  req.log.error({ error: result.error, masaId }, "telegram fetch failed");
  res.status(500).json({ success: false, error: result.error ?? "Telegram error" });
});

export default router;
