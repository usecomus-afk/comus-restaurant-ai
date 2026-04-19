import { Router, type IRouter, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { customers, stock, menus, chatLog } from "../lib/store.js";
import { sendCriticalAlert } from "../lib/emailSender.js";

const router: IRouter = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GUNESIN_SYSTEM_PROMPT = `Sen Güneşin Sofrası Meyhane'si garsonusun. Geleneksel İstanbul meyhane kültürünü yaşatıyorsun.

KURALLAR:
- Emoji kullanma
- Kısa yaz, maksimum 2-3 cümle
- Fiyat sorulmadıkça söyleme
- Hoş geldiniz sadece ilk mesajda bir kez söyle, bir daha asla tekrarlama
- Aynı soruyu iki kez sorma, cevap geldiyse geç
- Gurme öneriler yap, meze ve içki eşleştir
- Müşteri ne sorarsa kısa ve net cevap ver
- Müşteri kalori, reçete içeriği gibi bilgiler istediğinde "Size eksik veya yanlış bilgi vermek istemem. Servisteki garson ardaşlarıma sorabilirsiniz." cevabı ver.

KONUŞMA AKIŞI:
- İlk mesajda sadece şunu yaz: Hoş geldiniz efendim. İçecek tercihiniz ne olur?
- İçeceği öğrenince kaç kişi olduklarını sor
- Kişi sayısını öğrenince o akşam için öneri yap`;

const SYSTEM_PROMPT = `Sen Rebel Bar & Bistro'nun kişisel menü asistanısın. Misafirlerimizin gözde dostu, menüyü içten içe bilen ve onlara en güzel deneyimi yaşatmak için can atan bir rehbersin.

Görevin; menü soruları, kokteyl önerileri, alerjen bilgisi ve siparişlerde misafire gerçekten yardımcı olmak. Konuşma tonun sıcak, samimi ve rafine — sanki masanın başındaki deneyimli ve neşeli bir host gibi.

DİL: Varsayılan olarak Türkçe yanıt ver. Misafir İngilizce yazarsa İngilizce, Arapça yazarsa Arapça yanıtla.

MUTLU SAAT: Her gün saat 18:55'e kadar geçerli. Özel fiyatlar: Tuborg Fıçı 105₺, Carlsberg Fıçı 115₺, Guinness Fıçı 230₺, Weihenstephaner 230₺. Tuborg Ice tüm gün 105₺.

KOKTEYLLERİ YİYECEKLE BULUŞTUR: Yemek önerirken mutlaka bir kokteyl eşleşmesi sun. Negroni veya Rebel Şarap Tabağı → şarap & peynir tabaklarıyla; Fire Twist veya Passion Inferno → acılı ve baharatlı yemeklerle; Espresso Martini → yemek sonrası tatlı alternatifi olarak; Aperol Spritz / Campari Spritz → başlangıçlar ve salatalarla; Long Island veya Berry Salt → burgerlerle harika gider.

ÜSLUP: Yanıtlarını 2-3 cümleyle sınırla, detay istenmedikçe. İçten ve özgün ol — kuru bilgi verme, hafifçe anı canlandır. "Bu tabağın yanında..." ya da "Bugün özellikle tavsiye ederim..." gibi ifadeler kullan.

MALZEME KURALI (KRİTİK): Herhangi bir yemek önermeden önce [Bugünkü Menü]'deki o yemeğin tam açıklamasını dikkatle oku. Misafir bir malzemeyi istemiyorsa (örn. soğan, sarımsak, gluten), her yemeğin açıklamasının her kelimesini kontrol et. İstenmayan malzeme yemeğin açıklamasında geçiyorsa — resmi alerjen listesinde olmasa bile — o yemeği önerme. Emin değilsen önerme.`;

function buildCustomerContext(customerId: string): string | null {
  const customer = customers.get(customerId);
  if (!customer) return null;

  const parts: string[] = [`[Misafir Profili] Ad: ${customer.name}`];

  if (customer.allergies.length > 0) {
    parts.push(`Alerjiler: ${customer.allergies.join(", ")} — her yanıtta proaktif olarak belirt.`);
  }
  if (customer.preferences.length > 0) {
    parts.push(`Tercihler: ${customer.preferences.join(", ")}.`);
  }
  if (customer.notes) {
    parts.push(`Notlar: ${customer.notes}.`);
  }

  const visitCount = customer.visitHistory.length;
  if (visitCount > 0) {
    const lastVisit = customer.visitHistory[customer.visitHistory.length - 1];
    const lastDate = new Date(lastVisit.date).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    });
    parts.push(
      `Bu misafir bizimle daha önce ${visitCount} kez buluştu. Son ziyaret: ${lastDate}. Onu tanıdık ve değerli biri olarak içtenlikle karşıla.`,
    );
  } else {
    parts.push("Bu misafir ilk kez burada — kendini özel hissettir, ilk izlenimi unutulmaz kıl.");
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

  return `[Mutfak Durumu] Şu an hazırlanamayan yemekler — kesinlikle önerme. Misafir sorarsa nezaketle özür dile ve mevcut alternatifler sun: ${list}.`;
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
      const allergenLine = d.allergens.length ? ` | Alerjenler: ${d.allergens.join(", ")}` : "";
      const description = d.description || "";
      return `• ${d.name}${d.nameEn ? ` (${d.nameEn})` : ""} — ${d.price} ${menu.currency} | ${d.category}${allergenLine}\n  Açıklama: ${description}`;
    })
    .join("\n");

  return `[Bugünkü Menü]\n${available}`;
}

router.post("/", async (req: Request, res: Response) => {
  const { message, messages, restaurantId, tableNumber, language, customerId } =
    req.body as {
      message?: string;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      restaurantId?: string;
      tableNumber?: string | number;
      language?: string;
      customerId?: string;
    };

  const lastMessage = message?.trim() || messages?.[messages.length - 1]?.content?.trim();
  if (!lastMessage) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }

  const basePrompt = restaurantId === "gunesin-sofrasi" ? GUNESIN_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const systemParts: string[] = [basePrompt];

  const sessionParts = [
    restaurantId && `Restoran ID: ${restaurantId}`,
    tableNumber != null && `Masa: ${tableNumber}`,
    language && `Dil tercihi: ${language}`,
  ].filter(Boolean).join(", ");

  if (sessionParts) {
    systemParts.push(`[Oturum] ${sessionParts}`);
  }

  if (restaurantId) {
    const menuCtx = buildMenuContext(restaurantId);
    if (menuCtx) systemParts.push(menuCtx);

    const stockCtx = buildStockContext(restaurantId);
    if (stockCtx) systemParts.push(stockCtx);
  }

  let customerResolved: { name: string } | null = null;
  if (customerId) {
    const ctx = buildCustomerContext(customerId);
    if (ctx) {
      systemParts.push(ctx);
      customerResolved = customers.get(customerId) ?? null;
    }
  }

  const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> =
    messages && messages.length > 0
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : [{ role: "user", content: lastMessage }];

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemParts.join("\n\n"),
      messages: claudeMessages,
    });

    const reply =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    if (restaurantId) {
      chatLog.push({
        entryId: randomUUID(),
        restaurantId,
        tableNumber: tableNumber ?? undefined,
        customerId: customerId ?? undefined,
        message: lastMessage,
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
        model: response.model,
        restaurantId: restaurantId ?? null,
        tableNumber: tableNumber ?? null,
        language: language ?? "auto",
        customerId: customerId ?? null,
        guestName: customerResolved?.name ?? null,
        personalized: customerResolved !== null,
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStatus = (err as Record<string, unknown>)?.status ?? null;
    const errBody = (err as Record<string, unknown>)?.error ?? null;
    console.error("[Anthropic chat error]", { status: errStatus, message: errMsg, body: errBody });
    req.log.error({ err, errStatus, errMsg }, "Anthropic chat error");
    sendCriticalAlert(`Claude API hatası — restoran: ${restaurantId ?? "?"}, masa: ${tableNumber ?? "?"}`, err).catch(() => {});
    res.status(502).json({
      success: false,
      error: `AI error: ${errMsg}`,
      detail: { status: errStatus, body: errBody },
    });
  }
});

export default router;
