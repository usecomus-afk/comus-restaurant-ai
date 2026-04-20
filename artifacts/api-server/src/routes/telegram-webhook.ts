import { Router, type IRouter, type Request, type Response } from "express";
import { menus } from "../lib/store.js";
import {
  findDishById,
  isAuthorizedTelegramChat,
  parsePriceCommand,
  parseStockCommand,
  sendTelegramMessage,
} from "../lib/telegram.js";

const router: IRouter = Router();
/* ── INFO: check current webhook status ────────────────────── */
router.get("/info", async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(503).json({ success: false, error: "TELEGRAM_BOT_TOKEN not configured" });
    return;
  }
  try {
    const [whRes, meRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`),
      fetch(`https://api.telegram.org/bot${token}/getMe`),
    ]);
    const wh = await whRes.json();
    const me = await meRes.json();
    res.json({ success: true, webhookInfo: wh, botInfo: me });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    res.status(500).json({ success: false, error: msg });
  }
});

/* ── SETUP: register webhook with Telegram ─────────────────── */
router.post("/setup", async (req: Request, res: Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    res.status(503).json({ success: false, error: "TELEGRAM_BOT_TOKEN not configured" });
    return;
  }

  const domain =
    process.env.RAILWAY_PUBLIC_DOMAIN ??
    process.env.REPLIT_DEV_DOMAIN ??
    req.get("host");
  const webhookUrl = `https://${domain}/api/telegram/webhook`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    const data = (await tgRes.json()) as { ok: boolean; description?: string };
    if (data.ok) {
      req.log.info({ webhookUrl }, "Telegram webhook registered");
      res.json({ success: true, webhookUrl });
    } else {
      res.status(502).json({ success: false, error: data.description ?? "Telegram error" });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    res.status(500).json({ success: false, error: msg });
  }
});

/* ── WEBHOOK: receive Telegram updates ─────────────────────── */
router.post("/webhook", async (req: Request, res: Response) => {
  res.sendStatus(200);

  const body = req.body as {
    message?: {
      chat: { id: number; type: string };
      from?: { id: number; first_name?: string };
      text?: string;
      message_id?: number;
    };
  };

  const msg = body.message;
  if (!msg?.text || !msg.chat?.id) return;

  const chatId   = msg.chat.id;
  const chatType = msg.chat.type ?? "unknown";
  const text     = msg.text.trim();

  if (!isAuthorizedTelegramChat(chatId)) {
    req.log.warn({ chatId, chatType }, "Unauthorized Telegram message ignored");
    return;
  }

  if (text.startsWith("/start") || text.startsWith("/help")) {
    const helpText = [
      "Güneşin Sofrası Telegram Yönetim",
      "",
      "Komutlar:",
      "/fiyat [urun_id] [yeni_fiyat]",
      "Örn: /fiyat g010 290",
      "/stok [urun_id] [aktif/pasif]",
      "Örn: /stok g010 pasif",
    ].join("\n");
    await sendTelegramMessage(String(chatId), helpText);
    return;
  }

  const menuEntries = Array.from(menus.entries());
  if (menuEntries.length === 0) {
    await sendTelegramMessage(String(chatId), "❌ Menü bulunamadı.");
    return;
  }

  const priceCommand = parsePriceCommand(text);
  if (priceCommand) {
    const target = findDishById(priceCommand.dishId, menuEntries);
    if (!target) {
      await sendTelegramMessage(String(chatId), `❌ Ürün bulunamadı: ${priceCommand.dishId}`);
      return;
    }

    target.dish.price = priceCommand.newPrice;
    const menu = menus.get(target.key);
    if (!menu) {
      await sendTelegramMessage(String(chatId), "❌ Geçersiz fiyat. Örn: /fiyat g010 290");
      return;
    }
    menu.updatedAt = new Date().toISOString();
    menus.set(target.key, menu);

    await sendTelegramMessage(String(chatId), `✅ Fiyat güncellendi\nÜrün: ${target.dish.name} (${target.dish.id})\nYeni fiyat: ${priceCommand.newPrice.toLocaleString("tr-TR")} ₺`);
    req.log.info({ chatId, dishId: target.dish.id, price: priceCommand.newPrice, menuKey: target.key }, "menu price updated via telegram command");
    return;
  }

  const stockCommand = parseStockCommand(text);

  if (stockCommand) {
    const target = findDishById(stockCommand.dishId, menuEntries);
    if (!target) {
      await sendTelegramMessage(String(chatId), `❌ Ürün bulunamadı: ${stockCommand.dishId}`);
      return;
    }

    target.dish.available = stockCommand.isActive;
    const menu = menus.get(target.key);
    if (!menu) {
      await sendTelegramMessage(String(chatId), "❌ Menü bulunamadı.");
      return;
    }
    menu.updatedAt = new Date().toISOString();
    menus.set(target.key, menu);

    await sendTelegramMessage(String(chatId), `✅ Stok güncellendi\nÜrün: ${target.dish.name} (${target.dish.id})\nDurum: ${stockCommand.isActive ? "aktif" : "pasif"}`);
    req.log.info({ chatId, dishId: target.dish.id, isActive: stockCommand.isActive, menuKey: target.key }, "menu stock updated via telegram command");
    return;
  }

  await sendTelegramMessage(
    String(chatId),
    "❓ Komut anlaşılamadı.\n\nKullanım:\n/fiyat [urun_id] [yeni_fiyat]\n/stok [urun_id] [aktif/pasif]",
  );
});

export default router;
