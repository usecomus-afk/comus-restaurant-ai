import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { menus } from "../lib/store.js";
import { PARSER_PROMPT, applyChanges, type ParsedChanges } from "./menu-update.js";

const router: IRouter = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RESTAURANT_ID = "default";

async function sendTelegram(chatId: string | number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

function isAuthorized(chatId: number, chatType: string): boolean {
  const allowed = process.env.TELEGRAM_CHAT_ID;
  if (!allowed) return false;
  // Accept the configured group/channel
  if (String(chatId) === String(allowed)) return true;
  // Also accept direct messages to the bot (private chats)
  // The bot token is private so only staff who know the bot can DM it
  if (chatType === "private") return true;
  return false;
}

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

  if (!isAuthorized(chatId, chatType)) {
    req.log.warn({ chatId, chatType }, "Unauthorized Telegram message ignored");
    return;
  }

  if (text.startsWith("/start") || text.startsWith("/help")) {
    await sendTelegram(chatId,
      `🍽️ *Rebel Bar & Bistro — Menü Yönetimi*\n\n` +
      `Menüyü doğal dil ile yönetebilirsiniz:\n\n` +
      `• *Fiyat güncelle:* "Rebel Burger fiyatını 600 TL yap"\n` +
      `• *Tükendi:* "kuzu incik bitti"\n` +
      `• *Geldi:* "kuzu incik geldi"\n` +
      `• *Yeni ürün:* "yeni ürün ekle: İsim, 350TL, Açıklama"\n` +
      `• *Çıkar:* "Rebel Burger'i menüden çıkar"\n` +
      `• *Günün özel:* "bugün özel: Dana Ribs, 850TL, Özel sos ile"\n`
    );
    return;
  }

  const menu = menus.get(RESTAURANT_ID)!;
  const menuSummary = menu.dishes
    .map((d) => `- id: ${d.id}, "${d.name}", ${d.price} TL, ${d.category}${d.available === false ? " [TÜKENDİ]" : ""}${d.isSpecial ? " [ÖZEL]" : ""}`)
    .join("\n");

  let parsed: ParsedChanges;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PARSER_PROMPT },
        {
          role: "user",
          content: `Güncel menü (${RESTAURANT_ID}):\n${menuSummary}\n\nYönetici mesajı: "${text}"`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    parsed = JSON.parse(raw) as ParsedChanges;
  } catch (err) {
    req.log.error({ err, text }, "Telegram webhook AI parse error");
    await sendTelegram(chatId, "❌ AI servisi şu anda kullanılamıyor. Lütfen tekrar deneyin.");
    return;
  }

  if (!Array.isArray(parsed.changes) || parsed.changes.length === 0) {
    await sendTelegram(chatId,
      `❓ Anlaşılamadı: "${text}"\n\nYardım için /help yazın.`
    );
    return;
  }

  const { menu: updatedMenu, applied, notFound } = applyChanges(menu, parsed.changes);
  menus.set(RESTAURANT_ID, updatedMenu);

  req.log.info({ chatId, applied, notFound }, "menu updated via Telegram");

  const lines: string[] = [];
  lines.push(...applied);
  if (notFound.length > 0) {
    notFound.forEach((n) => lines.push(`❌ '${n}' menüde bulunamadı`));
  }

  await sendTelegram(chatId, lines.join("\n"));
});

export default router;
