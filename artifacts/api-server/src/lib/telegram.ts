import { type Dish } from "./store.js";

export interface TelegramConfig {
  token: string;
  notifyChatId: string;
  adminChatId: string;
}

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

export interface NormalizedOrderItem {
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
}

export function getTelegramConfig(): TelegramConfig {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN ?? "",
    notifyChatId: process.env.TELEGRAM_CHAT_ID ?? "",
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID ?? "",
  };
}

export function formatTableLabel(tableNumber: string | number): string {
  const raw = String(tableNumber).trim();
  const normalized = raw.replace(/^gunesin-/i, "").replace(/^masa-/i, "").trim();
  return normalized.length > 0 ? `Masa ${normalized}` : "Masa ?";
}

function parsePrice(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeOrderItems(items: unknown[]): NormalizedOrderItem[] {
  return items.map((item, idx) => {
    const row = item as Record<string, unknown>;
    const dishId = String(row.dishId ?? row.id ?? `item-${idx + 1}`);
    const dishName = String(row.dishName ?? row.name ?? row.title ?? dishId);
    const quantity = Math.max(1, Number(row.quantity ?? row.qty ?? 1) || 1);
    const unitPrice = parsePrice(row.unitPrice ?? row.price ?? row.amount ?? 0);

    return { dishId, dishName, quantity, unitPrice };
  });
}

export function calculateOrderTotal(items: NormalizedOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function formatTry(value: number): string {
  return `${value.toLocaleString("tr-TR")} ₺`;
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<TelegramResult> {
  const { token } = getTelegramConfig();
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: String(chatId), text }),
    });

    const data = (await response.json()) as { ok?: boolean; description?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, error: data.description ?? "Telegram API error" };
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function sendNotifyMessage(text: string): Promise<TelegramResult> {
  const { notifyChatId } = getTelegramConfig();
  if (!notifyChatId) return { ok: false, error: "TELEGRAM_CHAT_ID is not configured" };
  return sendTelegramMessage(notifyChatId, text);
}

export async function sendServiceRequestNotification(
  tableNumber: string | number,
  type: "garson" | "hesap",
): Promise<TelegramResult> {
  const operation = type === "garson" ? "Garson Çağır" : "Hesap İste";
  const text = `📍 ${formatTableLabel(tableNumber)} - ${operation} talebi geldi!`;
  return sendNotifyMessage(text);
}

export async function sendOrderNotification(
  tableNumber: string | number,
  items: NormalizedOrderItem[],
): Promise<TelegramResult> {
  const total = calculateOrderTotal(items);
  const header = `📍 ${formatTableLabel(tableNumber)} - Sipariş talebi geldi!`;
  const lines = items.map((item) => `• ${item.dishName} x${item.quantity} — ${formatTry(item.unitPrice * item.quantity)}`);
  const text = [
    header,
    "",
    "🧾 Ürün Listesi:",
    ...lines,
    "",
    `💰 Toplam Tutar: ${formatTry(total)}`,
  ].join("\n");

  return sendNotifyMessage(text);
}

export function parsePriceCommand(text: string): { dishId: string; newPrice: number } | null {
  const match = text.match(/^\/fiyat\s+(\S+)\s+([0-9]+(?:[.,][0-9]+)?)$/i);
  if (!match) return null;

  const dishId = match[1].trim();
  const newPrice = Number(match[2].replace(",", "."));
  if (!Number.isFinite(newPrice) || newPrice < 0) return null;

  return { dishId, newPrice };
}

export function parseStockCommand(text: string): { dishId: string; isActive: boolean } | null {
  const match = text.match(/^\/stok\s+(\S+)\s+(aktif|pasif)$/i);
  if (!match) return null;

  const dishId = match[1].trim();
  const isActive = match[2].toLowerCase() === "aktif";
  return { dishId, isActive };
}

export function parseTelegramStockFlag(raw: string): boolean | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "aktif") return true;
  if (normalized === "pasif") return false;
  return null;
}

export function isAuthorizedTelegramChat(chatId: number | string): boolean {
  const { adminChatId } = getTelegramConfig();
  if (!adminChatId) return false;
  return String(chatId) === String(adminChatId);
}

export function findDishById(
  dishId: string,
  menuEntries: Array<[string, { restaurantId: string; dishes: Dish[]; updatedAt: string }]>,
): { key: string; dish: Dish } | null {
  for (const [key, menu] of menuEntries) {
    const dish = menu.dishes.find((row) => row.id === dishId);
    if (dish) return { key, dish };
  }
  return null;
}
