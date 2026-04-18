import { Router, type IRouter, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { menus, type Dish, type Menu } from "../lib/store.js";

const router: IRouter = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const PARSER_PROMPT = `You are a menu management assistant for Rebel Bar & Bistro.
A restaurant manager has sent you a natural-language message (Turkish or English) to update their menu.
Parse the intent and return a JSON object with the following structure — nothing else, no markdown, no explanation:

{
  "changes": [
    {
      "action": "update_price",
      "dishId": "<id or null if new>",
      "dishName": "<name to identify dish>",
      "newPrice": <number>
    },
    {
      "action": "set_unavailable",
      "dishId": "<id or null>",
      "dishName": "<name to match>"
    },
    {
      "action": "set_available",
      "dishId": "<id or null>",
      "dishName": "<name to match>"
    },
    {
      "action": "daily_special",
      "dishId": "<id if existing dish, null if new>",
      "dishName": "<name if existing dish, null if new>",
      "dish": {
        "name": "<name — only if new dish>",
        "description": "<description — only if new dish>",
        "category": "<category — only if new dish>",
        "price": <number — only if new dish>,
        "allergens": [],
        "vegetarian": false,
        "vegan": false,
        "glutenFree": false
      }
    },
    {
      "action": "add_dish",
      "dish": {
        "name": "<name>",
        "nameEn": "<english name or null>",
        "description": "<description>",
        "category": "<Snacks|Burgers|Mains|Wraps|Salads|Pasta|Vegan|Cocktails|Drinks|Happy Hour|Specials>",
        "price": <number>,
        "allergens": ["<allergen>"],
        "vegetarian": <bool>,
        "vegan": <bool>,
        "glutenFree": <bool>
      }
    },
    {
      "action": "remove_dish",
      "dishId": "<id or null>",
      "dishName": "<name to match>"
    },
    {
      "action": "update_field",
      "dishId": "<id or null>",
      "dishName": "<name>",
      "field": "<field name>",
      "value": <new value>
    }
  ],
  "summary": "<one sentence in Turkish describing what was changed>"
}

Turkish keyword hints:
- "bitti" / "tükendi" / "kalmadı" → set_unavailable
- "geldi" / "var" / "hazır" → set_available
- "bugün özel" / "günün özel" / "özel ürün" → daily_special
- "fiyatını X yap" / "X TL" / "fiyat güncelle" → update_price
- "yeni ürün" / "ekle" / "menüye ekle" → add_dish
- "menüden çıkar" / "kaldır" / "sil" → remove_dish

Match dishes by name (case-insensitive, partial match is fine). The current menu will be provided as context.`;

export type ParsedAction =
  | { action: "update_price"; dishId?: string | null; dishName: string; newPrice: number }
  | { action: "set_unavailable"; dishId?: string | null; dishName: string }
  | { action: "set_available"; dishId?: string | null; dishName: string }
  | { action: "daily_special"; dishId?: string | null; dishName?: string | null; dish?: Partial<Dish> }
  | { action: "add_dish"; dish: Partial<Dish> }
  | { action: "remove_dish"; dishId?: string | null; dishName: string }
  | { action: "update_field"; dishId?: string | null; dishName: string; field: string; value: unknown };

export interface ParsedChanges {
  changes: ParsedAction[];
  summary: string;
}

export function findDish(dishes: Dish[], nameHint: string, idHint?: string | null): Dish | undefined {
  if (idHint) {
    const byId = dishes.find((d) => d.id === idHint);
    if (byId) return byId;
  }
  const lower = nameHint.toLowerCase();
  return dishes.find(
    (d) =>
      d.name.toLowerCase().includes(lower) ||
      (d.nameEn ?? "").toLowerCase().includes(lower),
  );
}

export function applyChanges(menu: Menu, changes: ParsedAction[]): { menu: Menu; applied: string[]; notFound: string[] } {
  const dishes = [...menu.dishes];
  const applied: string[] = [];
  const notFound: string[] = [];

  for (const change of changes) {
    if (change.action === "update_price") {
      const dish = findDish(dishes, change.dishName, change.dishId);
      if (dish) {
        dish.price = change.newPrice;
        applied.push(`✅ "${dish.name}" fiyatı ${change.newPrice} TL olarak güncellendi`);
      } else {
        notFound.push(change.dishName);
      }
    } else if (change.action === "set_unavailable") {
      const dish = findDish(dishes, change.dishName, change.dishId);
      if (dish) {
        dish.available = false;
        applied.push(`✅ "${dish.name}" menüden gizlendi (tükendi)`);
      } else {
        notFound.push(change.dishName);
      }
    } else if (change.action === "set_available") {
      const dish = findDish(dishes, change.dishName, change.dishId);
      if (dish) {
        dish.available = true;
        applied.push(`✅ "${dish.name}" menüye geri eklendi`);
      } else {
        notFound.push(change.dishName);
      }
    } else if (change.action === "daily_special") {
      if (change.dishId || change.dishName) {
        const dish = findDish(dishes, change.dishName ?? "", change.dishId);
        if (dish) {
          dish.isSpecial = true;
          applied.push(`⭐ "${dish.name}" bugünün özel ürünü olarak işaretlendi`);
        } else {
          notFound.push(change.dishName ?? "?");
        }
      } else if (change.dish?.name) {
        const newDish: Dish = {
          id: `sp${randomUUID().slice(0, 6)}`,
          name: change.dish.name,
          description: change.dish.description ?? "",
          category: change.dish.category ?? "Specials",
          price: change.dish.price ?? 0,
          allergens: change.dish.allergens ?? [],
          vegetarian: change.dish.vegetarian ?? false,
          vegan: change.dish.vegan ?? false,
          glutenFree: change.dish.glutenFree ?? false,
          isSpecial: true,
          available: true,
        };
        dishes.push(newDish);
        applied.push(`⭐ "${newDish.name}" bugünün özel ürünü olarak eklendi (${newDish.price} TL)`);
      }
    } else if (change.action === "remove_dish") {
      const idx = dishes.findIndex(
        (d) =>
          (change.dishId && d.id === change.dishId) ||
          d.name.toLowerCase().includes(change.dishName.toLowerCase()) ||
          (d.nameEn ?? "").toLowerCase().includes(change.dishName.toLowerCase()),
      );
      if (idx !== -1) {
        applied.push(`✅ "${dishes[idx].name}" menüden kaldırıldı`);
        dishes.splice(idx, 1);
      } else {
        notFound.push(change.dishName);
      }
    } else if (change.action === "add_dish") {
      const newDish: Dish = {
        id: `d${randomUUID().slice(0, 6)}`,
        name: change.dish.name ?? "New Dish",
        nameEn: change.dish.nameEn ?? undefined,
        description: change.dish.description ?? "",
        category: change.dish.category ?? "Other",
        price: change.dish.price ?? 0,
        allergens: change.dish.allergens ?? [],
        vegetarian: change.dish.vegetarian ?? false,
        vegan: change.dish.vegan ?? false,
        glutenFree: change.dish.glutenFree ?? false,
        spiceLevel: change.dish.spiceLevel ?? 0,
        wineParings: change.dish.wineParings ?? [],
        available: true,
      };
      dishes.push(newDish);
      applied.push(`✅ "${newDish.name}" menüye eklendi (${newDish.price} TL)`);
    } else if (change.action === "update_field") {
      const dish = findDish(dishes, change.dishName, change.dishId);
      if (dish && change.field in dish) {
        (dish as Record<string, unknown>)[change.field] = change.value;
        applied.push(`✅ "${dish.name}" → ${change.field} güncellendi`);
      } else {
        notFound.push(change.dishName);
      }
    }
  }

  return {
    menu: { ...menu, dishes, updatedAt: new Date().toISOString() },
    applied,
    notFound,
  };
}

router.post("/", async (req: Request, res: Response) => {
  const { restaurantId, message, updatedBy } = req.body as {
    restaurantId?: string;
    message?: string;
    updatedBy?: string;
  };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }

  const menu = menus.get(restaurantId) ?? menus.get("default")!;

  const currentMenuSummary = menu.dishes
    .map((d) => `- id: ${d.id}, name: "${d.name}", price: ${d.price} ${menu.currency}, category: ${d.category}`)
    .join("\n");

  try {
    const completion = await client.messages.create({
      model: "claude-sonnet-4-5-20251022",
      max_tokens: 1024,
      system: PARSER_PROMPT,
      messages: [
        {
          role: "user",
          content: `Current menu for restaurant "${restaurantId}":\n${currentMenuSummary}\n\nManager message: "${message}"`,
        },
      ],
    });

    const raw = completion.content[0]?.type === "text" ? completion.content[0].text : "{}";
    let parsed: ParsedChanges;

    try {
      parsed = JSON.parse(raw) as ParsedChanges;
    } catch {
      req.log.error({ raw }, "Failed to parse AI menu update response");
      res.status(502).json({ success: false, error: "AI returned invalid JSON" });
      return;
    }

    if (!Array.isArray(parsed.changes) || parsed.changes.length === 0) {
      res.json({
        success: true,
        data: {
          applied: [],
          summary: parsed.summary ?? "No changes were detected in your message.",
          menu,
        },
      });
      return;
    }

    const { menu: updatedMenu, applied, notFound } = applyChanges(menu, parsed.changes);
    menus.set(restaurantId, updatedMenu);
    if (restaurantId !== "default") menus.set(restaurantId, updatedMenu);

    req.log.info(
      { restaurantId, applied, updatedBy: updatedBy ?? "unknown" },
      "menu updated via natural language",
    );

    res.json({
      success: true,
      data: {
        applied,
        notFound,
        summary: parsed.summary,
        changesCount: applied.length,
        updatedBy: updatedBy ?? null,
        updatedAt: updatedMenu.updatedAt,
        menu: updatedMenu,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Menu update AI error");
    res.status(502).json({ success: false, error: "AI service unavailable" });
  }
});

export default router;
