import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import {
  feedbacks,
  customers,
  createNotification,
  type Feedback,
} from "../lib/store.js";
import { broadcast } from "../lib/ws.js";

const router: IRouter = Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AI_RESPONSE_PROMPT = `You are Comus, an AI maître d' crafting a personal response to a guest's restaurant review.

Rules:
- For ratings 1-2 (crisis): Be sincerely apologetic, take full ownership, offer a concrete remedy (e.g. complimentary visit, personal follow-up from the manager). Warm but urgent. Do NOT sound like a generic bot.
- For rating 3 (neutral): Thank sincerely, acknowledge what could be improved, express genuine commitment.
- For ratings 4-5 (celebration): Warm, specific, genuinely delighted — not over-the-top. Mirror the guest's energy.
- Respond in the same language as the guest's comment. If no comment, respond in English.
- Keep it to 3-4 sentences. Sign off as "The Comus Team".`;

router.post("/", async (req: Request, res: Response) => {
  const {
    restaurantId,
    rating,
    comment,
    tableNumber,
    customerId,
    guestName,
    orderId,
  } = req.body as {
    restaurantId?: string;
    rating?: number;
    comment?: string;
    tableNumber?: string | number;
    customerId?: string;
    guestName?: string;
    orderId?: string;
  };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    res.status(400).json({ success: false, error: "rating must be an integer 1–5" });
    return;
  }

  const resolvedRating = rating as 1 | 2 | 3 | 4 | 5;
  const resolvedGuestName =
    guestName ?? (customerId ? (customers.get(customerId)?.name ?? null) : null);

  const userPrompt = [
    `Rating: ${resolvedRating}/5`,
    resolvedGuestName && `Guest name: ${resolvedGuestName}`,
    tableNumber != null && `Table: ${tableNumber}`,
    comment ? `Comment: "${comment}"` : "Guest left no written comment.",
  ]
    .filter(Boolean)
    .join("\n");

  let aiResponse = "";
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: AI_RESPONSE_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 256,
      temperature: 0.75,
    });
    aiResponse = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    req.log.error({ err }, "AI feedback response error");
    aiResponse =
      resolvedRating <= 2
        ? "We sincerely apologise for your experience. Our manager will be in touch very shortly. — The Comus Team"
        : "Thank you for your wonderful words — they mean everything to us. — The Comus Team";
  }

  const notificationIds: string[] = [];
  let crisisAlert = false;
  let celebrationAlert = false;
  const stars = "★".repeat(resolvedRating) + "☆".repeat(5 - resolvedRating);

  if (resolvedRating <= 2) {
    crisisAlert = true;
    const notif = createNotification({
      type: "alert",
      restaurantId,
      tableNumber,
      message:
        `🚨 HOT CRISIS — ${stars} (${resolvedRating}/5)` +
        (comment ? ` | "${comment}"` : "") +
        (resolvedGuestName ? ` | Guest: ${resolvedGuestName}` : "") +
        ` | MANAGER ACTION REQUIRED IMMEDIATELY.`,
      priority: "high",
    });
    notificationIds.push(notif.id);
    req.log.warn(
      { restaurantId, rating: resolvedRating, tableNumber },
      "crisis feedback — manager alerted",
    );
  } else if (resolvedRating >= 4) {
    celebrationAlert = true;
    const notif = createNotification({
      type: "special_request",
      restaurantId,
      tableNumber,
      message:
        `🎉 TEAM WIN — ${stars} (${resolvedRating}/5)` +
        (comment ? ` | "${comment}"` : " | A guest had a wonderful experience!") +
        (resolvedGuestName ? ` | Guest: ${resolvedGuestName}` : "") +
        " | Share this with the whole team — you earned it!",
      priority: "low",
    });
    notificationIds.push(notif.id);
    req.log.info(
      { restaurantId, rating: resolvedRating, tableNumber },
      "celebration feedback — staff notified",
    );
  }

  const feedback: Feedback = {
    feedbackId: randomUUID(),
    restaurantId,
    rating: resolvedRating,
    comment: comment ?? undefined,
    tableNumber: tableNumber ?? undefined,
    customerId: customerId ?? undefined,
    guestName: resolvedGuestName ?? undefined,
    orderId: orderId ?? undefined,
    aiResponse,
    crisisAlert,
    celebrationAlert,
    notificationIds,
    createdAt: new Date().toISOString(),
  };

  feedbacks.set(feedback.feedbackId, feedback);
  broadcast("feedback:new", feedback);
  req.log.info(
    { feedbackId: feedback.feedbackId, restaurantId, rating: resolvedRating },
    "feedback recorded",
  );

  res.status(201).json({
    success: true,
    data: {
      feedbackId: feedback.feedbackId,
      rating: resolvedRating,
      aiResponse,
      crisisAlert,
      celebrationAlert,
      notificationIds,
      message:
        resolvedRating <= 2
          ? "Your feedback has been escalated to our manager immediately."
          : resolvedRating >= 4
            ? "Thank you — your kind words have been shared with our whole team."
            : "Thank you for your honest feedback.",
    },
  });
});

router.get("/", (req: Request, res: Response) => {
  const { restaurantId, minRating, maxRating, crisis } = req.query as {
    restaurantId?: string;
    minRating?: string;
    maxRating?: string;
    crisis?: string;
  };

  let result = Array.from(feedbacks.values());

  if (restaurantId) result = result.filter((f) => f.restaurantId === restaurantId);
  if (minRating) result = result.filter((f) => f.rating >= Number(minRating));
  if (maxRating) result = result.filter((f) => f.rating <= Number(maxRating));
  if (crisis === "true") result = result.filter((f) => f.crisisAlert);

  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const avg =
    result.length > 0
      ? result.reduce((s, f) => s + f.rating, 0) / result.length
      : null;

  res.json({
    success: true,
    data: result,
    total: result.length,
    averageRating: avg !== null ? Math.round(avg * 100) / 100 : null,
    crisisCount: result.filter((f) => f.crisisAlert).length,
    celebrationCount: result.filter((f) => f.celebrationAlert).length,
  });
});

router.get("/:feedbackId", (req: Request, res: Response) => {
  const fb = feedbacks.get(req.params.feedbackId);
  if (!fb) {
    res.status(404).json({ success: false, error: "Feedback not found" });
    return;
  }
  res.json({ success: true, data: fb });
});

export default router;
