import { getSupabase } from "./supabase.js";
import type { Feedback, Order } from "./store.js";

function sb() { return getSupabase(); }

function fire(promise: Promise<unknown>): void {
  promise.catch((err) => console.error("[SupabaseDb] write error:", err));
}

export function dbLogFeedback(feedback: Feedback): void {
  const db = sb();
  if (!db) return;
  fire(
    db.from("feedback").insert({
      id: feedback.feedbackId,
      restaurant_id: feedback.restaurantId,
      table_number: String(feedback.tableNumber ?? ""),
      rating: feedback.rating,
      guest_name: feedback.guestName ?? null,
      message: feedback.comment ?? null,
      created_at: feedback.createdAt,
    }),
  );
}

export function dbLogOrder(order: Order): void {
  const db = sb();
  if (!db) return;
  const total = order.items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);
  fire(
    db.from("orders").insert({
      id: order.orderId,
      restaurant_id: order.restaurantId,
      table_number: String(order.tableNumber),
      items: order.items,
      total,
      created_at: order.createdAt,
    }),
  );
}

export function dbLogConversation(
  restaurantId: string,
  tableNumber: string | number,
  role: "user" | "assistant",
  content: string,
): void {
  const db = sb();
  if (!db) return;
  const tableKey = String(tableNumber);

  fire(
    (async () => {
      const { data } = await db
        .from("conversations")
        .select("id, messages")
        .eq("restaurant_id", restaurantId)
        .eq("table_number", tableKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const newMsg = { role, content, ts: new Date().toISOString() };

      if (data) {
        const msgs: unknown[] = Array.isArray(data.messages) ? data.messages : [];
        msgs.push(newMsg);
        await db
          .from("conversations")
          .update({ messages: msgs, updated_at: new Date().toISOString() })
          .eq("id", data.id);
      } else {
        await db.from("conversations").insert({
          restaurant_id: restaurantId,
          table_number: tableKey,
          messages: [newMsg],
        });
      }
    })(),
  );
}

export function dbUpdateMenuItem(
  restaurantId: string,
  itemId: string,
  updates: { price?: number; is_active?: boolean; description?: string },
): void {
  const db = sb();
  if (!db) return;
  fire(
    db
      .from("menu_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("restaurant_id", restaurantId)
      .eq("id", itemId),
  );
}
