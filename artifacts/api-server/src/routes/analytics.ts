import { Router, type IRouter, type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { orders, feedbacks, chatLog, menus } from "../lib/store.js";

const router: IRouter = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function isoMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function hourLabel(dateStr: string): string {
  return `${new Date(dateStr).getUTCHours().toString().padStart(2, "0")}:00`;
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (result[k] ??= []).push(item);
  }
  return result;
}

function last<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

router.get("/:restaurantId", async (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { period = "30d" } = req.query as { period?: string };

  const periodDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - periodDays * 86400000).toISOString();

  const allOrders = Array.from(orders.values()).filter(
    (o) => o.restaurantId === restaurantId,
  );
  const periodOrders = allOrders.filter((o) => o.createdAt >= since);
  const allFeedbacks = Array.from(feedbacks.values()).filter(
    (f) => f.restaurantId === restaurantId,
  );
  const periodFeedbacks = allFeedbacks.filter((f) => f.createdAt >= since);
  const periodChats = chatLog.filter(
    (c) => c.restaurantId === restaurantId && c.timestamp >= since,
  );

  const menu = menus.get(restaurantId) ?? menus.get("default");

  // ── Weekly order volume (last 8 weeks) ────────────────────────────────────
  const byWeek = groupBy(allOrders, (o) => isoWeek(new Date(o.createdAt)));
  const weeklyVolume = last(
    Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, os]) => ({
        week,
        orders: os.length,
        revenue: os.reduce(
          (s, o) =>
            s + o.items.reduce((si, it) => si + it.quantity * (it.unitPrice ?? 0), 0),
          0,
        ),
      })),
    8,
  );

  // ── Monthly order volume (last 6 months) ──────────────────────────────────
  const byMonth = groupBy(allOrders, (o) => isoMonth(o.createdAt));
  const monthlyVolume = last(
    Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, os]) => ({
        month,
        orders: os.length,
        revenue: os.reduce(
          (s, o) =>
            s + o.items.reduce((si, it) => si + it.quantity * (it.unitPrice ?? 0), 0),
          0,
        ),
      })),
    6,
  );

  // ── Rating trend (weekly avg, last 8 weeks) ───────────────────────────────
  const fbByWeek = groupBy(allFeedbacks, (f) => isoWeek(new Date(f.createdAt)));
  const ratingTrend = last(
    Object.entries(fbByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, fbs]) => ({
        week,
        avgRating:
          Math.round(
            (fbs.reduce((s, f) => s + f.rating, 0) / fbs.length) * 100,
          ) / 100,
        count: fbs.length,
        crisisCount: fbs.filter((f) => f.crisisAlert).length,
      })),
    8,
  );

  // ── Peak dining hours ────────────────────────────────────────────────────
  const byHour = groupBy(periodOrders, (o) => hourLabel(o.createdAt));
  const peakHours = Object.entries(byHour)
    .map(([hour, os]) => ({ hour, orders: os.length }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  // ── Overall KPIs for the period ──────────────────────────────────────────
  const periodRevenue = periodOrders.reduce(
    (s, o) => s + o.items.reduce((si, it) => si + it.quantity * (it.unitPrice ?? 0), 0),
    0,
  );
  const avgRatingPeriod =
    periodFeedbacks.length > 0
      ? Math.round(
          (periodFeedbacks.reduce((s, f) => s + f.rating, 0) / periodFeedbacks.length) * 100,
        ) / 100
      : null;

  // ── Ghost menu: dishes on the menu never ordered in the period ────────────
  const orderedDishIds = new Set(
    periodOrders.flatMap((o) => o.items.map((it) => it.dishId)),
  );
  const ghostMenu = (menu?.dishes ?? [])
    .filter((d) => !orderedDishIds.has(d.id))
    .map((d) => ({
      dishId: d.id,
      name: d.name,
      nameEn: d.nameEn,
      price: d.price,
      category: d.category,
      insight: "On the menu but received zero orders in this period.",
    }));

  // ── Missing menu & top complaints: AI extraction ─────────────────────────
  const chatSamples = periodChats
    .map((c) => c.message)
    .slice(-80);

  const crisisFeedback = periodFeedbacks
    .filter((f) => f.crisisAlert && f.comment)
    .map((f) => `(${f.rating}★) ${f.comment}`)
    .slice(-40);

  const allFeedbackComments = periodFeedbacks
    .filter((f) => f.comment)
    .map((f) => `(${f.rating}★) ${f.comment}`)
    .slice(-60);

  const menuNames = (menu?.dishes ?? []).map((d) => d.name).join(", ");

  let missingMenuItems: { item: string; frequency: string; suggestedAction: string }[] = [];
  let topComplaints: { issue: string; frequency: string; suggestedAction: string }[] = [];
  let ghostMenuInsights: { dishId: string; possibleReason: string }[] = [];

  if (chatSamples.length > 0 || crisisFeedback.length > 0) {
    try {
      const aiPrompt = `You are a restaurant business intelligence analyst for Comus, a Turkish fine dining restaurant.

Current menu items: ${menuNames}

Analyze the following guest chat messages and feedback comments to extract insights. Return ONLY valid JSON with no markdown or explanation:

{
  "missingMenuItems": [
    {
      "item": "<dish or drink or item guests asked for that is NOT on the menu>",
      "frequency": "<how often mentioned: once|occasionally|repeatedly>",
      "suggestedAction": "<brief recommendation for the chef/manager>"
    }
  ],
  "topComplaints": [
    {
      "issue": "<recurring complaint or pain point>",
      "frequency": "<once|occasionally|repeatedly>",
      "suggestedAction": "<brief actionable fix>"
    }
  ],
  "ghostMenuInsights": [
    {
      "dishId": "<dishId from ghost menu list if relevant, otherwise null>",
      "possibleReason": "<why guests may not be ordering this dish based on chat patterns>"
    }
  ]
}

Ghost menu dishes (never ordered this period): ${JSON.stringify(ghostMenu.map((g) => ({ id: g.dishId, name: g.name })))}

Guest chat messages (last ${chatSamples.length}):
${chatSamples.map((m, i) => `${i + 1}. "${m}"`).join("\n")}

Feedback comments (last ${allFeedbackComments.length}):
${allFeedbackComments.map((c, i) => `${i + 1}. ${c}`).join("\n")}

If there is not enough data to extract a meaningful insight, return empty arrays. Do not invent data.`;

      const completion = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: "You are a data analyst. Always respond with valid JSON only — no markdown, no explanation.",
        messages: [{ role: "user", content: aiPrompt }],
      });

      const raw = completion.content[0]?.type === "text" ? completion.content[0].text : "{}";
      const parsed = JSON.parse(raw) as {
        missingMenuItems?: typeof missingMenuItems;
        topComplaints?: typeof topComplaints;
        ghostMenuInsights?: typeof ghostMenuInsights;
      };

      missingMenuItems = parsed.missingMenuItems ?? [];
      topComplaints = parsed.topComplaints ?? [];
      ghostMenuInsights = parsed.ghostMenuInsights ?? [];
    } catch (err) {
      req.log.error({ err }, "Analytics AI extraction error");
    }
  }

  // Merge AI ghost insights into ghost menu
  const enrichedGhostMenu = ghostMenu.map((g) => {
    const insight = ghostMenuInsights.find((i) => i.dishId === g.dishId);
    return { ...g, aiInsight: insight?.possibleReason ?? null };
  });

  req.log.info({ restaurantId, period }, "analytics fetched");

  res.json({
    success: true,
    data: {
      restaurantId,
      period,
      generatedAt: new Date().toISOString(),
      kpis: {
        totalOrdersPeriod: periodOrders.length,
        totalRevenuePeriod: periodRevenue,
        avgRatingPeriod,
        totalFeedbackPeriod: periodFeedbacks.length,
        crisisAlertsPeriod: periodFeedbacks.filter((f) => f.crisisAlert).length,
        celebrationAlertsPeriod: periodFeedbacks.filter((f) => f.celebrationAlert).length,
        totalChatMessagesPeriod: periodChats.length,
        totalCustomers: Array.from(
          new Set(allOrders.map((o) => o.guestName).filter(Boolean)),
        ).length,
      },
      trends: {
        weeklyVolume,
        monthlyVolume,
        ratingTrend,
        peakHours,
      },
      ghostMenu: enrichedGhostMenu,
      missingMenuItems,
      topComplaints,
    },
  });
});

export default router;
