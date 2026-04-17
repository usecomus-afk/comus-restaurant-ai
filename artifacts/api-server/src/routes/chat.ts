import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { customers, stock, menus, chatLog } from "../lib/store.js";

const router: IRouter = Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the AI assistant for Rebel Bar & Bistro. You help guests with menu questions, cocktail recommendations, allergen info, and orders. Your tone is friendly, casual, and welcoming — like a knowledgeable bar host.

LANGUAGE: Always respond in Turkish by default. Switch to English if the guest writes in English, or Arabic if they write in Arabic.

HAPPY HOUR: Every day until 18:55. Special prices: Tuborg Fıçı 105₺, Carlsberg Fıçı 115₺, Guinness Fıçı 230₺, Weihenstephaner 230₺. Tuborg Ice is available all day at 105₺.

COCKTAIL PAIRING TIPS: Actively recommend cocktails with food. Example pairings: Negroni or Rebel Şarap Tabağı → wine board; Fire Twist or Passion Inferno → spicy dishes; Espresso Martini → after dinner; Aperol Spritz / Campari Spritz → starters and salads; Long Island or Berry Salt → burgers.

STYLE: Keep answers to 2-3 sentences unless detail is requested. Be warm and specific, not generic.

CRITICAL INGREDIENT RULE: Before recommending any dish, carefully read its full description in [Today's Available Menu]. If the guest asks to avoid an ingredient (e.g. onion, garlic, gluten), check every word of each dish's description. Never recommend a dish if the excluded ingredient appears anywhere in its description — even if it is not listed as a formal allergen. When in doubt, do not recommend the dish.`;

function buildCustomerContext(customerId: string): string | null {
  const customer = customers.get(customerId);
  if (!customer) return null;

  const parts: string[] = [`[Guest Profile] Name: ${customer.name}`];

  if (customer.allergies.length > 0) {
    parts.push(`Allergies: ${customer.allergies.join(", ")} — always flag these proactively.`);
  }
  if (customer.preferences.length > 0) {
    parts.push(`Preferences: ${customer.preferences.join(", ")}.`);
  }
  if (customer.notes) {
    parts.push(`Notes: ${customer.notes}.`);
  }

  const visitCount = customer.visitHistory.length;
  if (visitCount > 0) {
    const lastVisit = customer.visitHistory[customer.visitHistory.length - 1];
    const lastDate = new Date(lastVisit.date).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    parts.push(
      `This is a returning guest — ${visitCount} visit${visitCount > 1 ? "s" : ""} on record. Last visit: ${lastDate}. Greet them warmly as a valued regular.`,
    );
  } else {
    parts.push("This is a first-time guest — make them feel especially welcome.");
  }

  return parts.join(" ");
}

function buildStockContext(restaurantId: string): string | null {
  const outOfStock = Array.from(stock.values()).filter(
    (s) => s.restaurantId === restaurantId && !s.available,
  );
  if (outOfStock.length === 0) return null;

  const list = outOfStock
    .map((s) => `"${s.dishName}"${s.reason ? ` (${s.reason})` : ""}`)
    .join(", ");

  return `[Kitchen Stock] The following dishes are currently UNAVAILABLE — do NOT recommend them. If a guest asks, apologise gracefully and suggest available alternatives: ${list}.`;
}

function buildMenuContext(restaurantId: string): string | null {
  const menu = menus.get(restaurantId) ?? menus.get("default");
  if (!menu) return null;

  const outOfStockIds = new Set(
    Array.from(stock.values())
      .filter((s) => s.restaurantId === restaurantId && !s.available)
      .map((s) => s.dishId),
  );

  const available = menu.dishes
    .filter((d) => !outOfStockIds.has(d.id))
    .map((d) => {
      const allergenLine = d.allergens.length ? ` | Allergens: ${d.allergens.join(", ")}` : "";
      const description = d.description || "";
      return `• ${d.name}${d.nameEn ? ` (${d.nameEn})` : ""} — ${d.price} ${menu.currency} | ${d.category}${allergenLine}\n  Description: ${description}`;
    })
    .join("\n");

  return `[Today's Available Menu]\n${available}`;
}

router.post("/", async (req: Request, res: Response) => {
  const { message, restaurantId, tableNumber, language, customerId } =
    req.body as {
      message?: string;
      restaurantId?: string;
      tableNumber?: string | number;
      language?: string;
      customerId?: string;
    };

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }

  const systemMessages: { role: "system"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  const sessionParts = [
    restaurantId && `Restaurant ID: ${restaurantId}`,
    tableNumber != null && `Table: ${tableNumber}`,
    language && `Language preference: ${language}`,
  ].filter(Boolean).join(", ");

  if (sessionParts) {
    systemMessages.push({ role: "system", content: `[Session] ${sessionParts}` });
  }

  if (restaurantId) {
    const menuCtx = buildMenuContext(restaurantId);
    if (menuCtx) systemMessages.push({ role: "system", content: menuCtx });

    const stockCtx = buildStockContext(restaurantId);
    if (stockCtx) systemMessages.push({ role: "system", content: stockCtx });
  }

  let customerResolved: { name: string } | null = null;
  if (customerId) {
    const ctx = buildCustomerContext(customerId);
    if (ctx) {
      systemMessages.push({ role: "system", content: ctx });
      customerResolved = customers.get(customerId) ?? null;
    }
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...systemMessages, { role: "user", content: message }],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    if (restaurantId) {
      chatLog.push({
        entryId: randomUUID(),
        restaurantId,
        tableNumber: tableNumber ?? undefined,
        customerId: customerId ?? undefined,
        message: message.trim(),
        language: language ?? undefined,
        timestamp: new Date().toISOString(),
      });
    }

    req.log.info(
      { restaurantId, tableNumber, customerId: customerId ?? null },
      "chat request handled",
    );

    res.json({
      success: true,
      data: {
        reply,
        model: completion.model,
        restaurantId: restaurantId ?? null,
        tableNumber: tableNumber ?? null,
        language: language ?? "auto",
        customerId: customerId ?? null,
        guestName: customerResolved?.name ?? null,
        personalized: customerResolved !== null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI chat error");
    res.status(502).json({ success: false, error: "AI service unavailable" });
  }
});

export default router;
