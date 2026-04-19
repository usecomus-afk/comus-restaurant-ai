import nodemailer from "nodemailer";
import { chatLog, notifications, orders, feedbacks, restaurants } from "./store.js";

const EMAIL_USER  = process.env.COMUS_EMAIL_USER  ?? "";
const EMAIL_PASS  = process.env.COMUS_EMAIL_PASS  ?? "";
const ALERT_EMAIL = process.env.COMUS_ALERT_EMAIL ?? "usecomus@gmail.com";

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

async function sendMail(subject: string, text: string): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn("[EmailSender] COMUS_EMAIL_USER or COMUS_EMAIL_PASS not set — skipping email.");
    return;
  }
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: `"Comus System" <${EMAIL_USER}>`,
      to: ALERT_EMAIL,
      subject,
      text,
    });
    console.log(`[EmailSender] Sent: ${subject}`);
  } catch (err) {
    console.error("[EmailSender] Failed to send email:", err);
  }
}

export async function sendDailyReport(): Promise<void> {
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const activeRestaurants = Array.from(restaurants.values()).map((r) => r.name).join(", ") || "—";
  const totalChats         = chatLog.length;
  const totalOrders        = orders.size;
  const garsonCalls        = notifications.filter(
    (n) => n.message.includes("GARSON") || n.message.includes("garson") || n.type === "assistance_needed",
  ).length;
  const hesapCalls         = notifications.filter(
    (n) => n.message.includes("HESAP") || n.message.includes("hesap"),
  ).length;
  const uptimeMs           = process.uptime() * 1000;
  const uptimeHours        = Math.floor(uptimeMs / 3_600_000);
  const uptimeMins         = Math.floor((uptimeMs % 3_600_000) / 60_000);

  const text = [
    `COMUS GÜNLÜK RAPOR — ${today}`,
    `${"─".repeat(40)}`,
    ``,
    `Aktif Restoranlar  : ${activeRestaurants}`,
    `GurmeAI Konuşması  : ${totalChats}`,
    `Sipariş Bildirimi  : ${totalOrders}`,
    `Garson Çağrısı     : ${garsonCalls}`,
    `Hesap Talebi       : ${hesapCalls}`,
    `Sistem Uptime      : ${uptimeHours}s ${uptimeMins}dk`,
    ``,
    `─`.repeat(40),
    `Bu rapor Comus CRM tarafından otomatik oluşturulmuştur.`,
  ].join("\n");

  await sendMail(`📋 Comus Günlük Rapor — ${today}`, text);
}

export async function sendWeeklyReport(): Promise<void> {
  const now   = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const fmt = (d: Date) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  const range = `${fmt(weekStart)} – ${fmt(now)}`;

  const byRestaurant: Record<string, number> = {};
  for (const entry of chatLog) {
    const id = entry.restaurantId ?? "bilinmiyor";
    byRestaurant[id] = (byRestaurant[id] ?? 0) + 1;
  }

  const chatBreakdown = Object.entries(byRestaurant)
    .map(([id, count]) => `  ${id}: ${count} konuşma`)
    .join("\n") || "  Veri yok";

  const allFeedbacks  = Array.from(feedbacks.values());
  const ratedFeedbacks = allFeedbacks.filter((f) => typeof f.rating === "number");
  const avgRating =
    ratedFeedbacks.length > 0
      ? (ratedFeedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / ratedFeedbacks.length).toFixed(1)
      : "—";

  const text = [
    `COMUS HAFTALIK RAPOR — ${range}`,
    `${"─".repeat(40)}`,
    ``,
    `RESTORAN BAZLI GURMEAI KONUŞMALARI`,
    chatBreakdown,
    ``,
    `GENEL ÖZET`,
    `  Toplam Konuşma    : ${chatLog.length}`,
    `  Toplam Değerlend. : ${allFeedbacks.length}`,
    `  Ort. Memnuniyet   : ${avgRating} / 5`,
    `  Toplam Bildirim   : ${notifications.length}`,
    ``,
    `─`.repeat(40),
    `Bu rapor Comus CRM tarafından otomatik oluşturulmuştur.`,
  ].join("\n");

  await sendMail(`📊 Comus Haftalık Rapor — ${range}`, text);
}

export async function sendCriticalAlert(context: string, error: unknown): Promise<void> {
  const ts = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const errMsg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  const text = [
    `COMUS KRİTİK HATA — ${ts}`,
    `${"─".repeat(40)}`,
    ``,
    `Bağlam : ${context}`,
    `Hata   : ${errMsg}`,
    ``,
    `─`.repeat(40),
    `Lütfen sistemi kontrol edin.`,
  ].join("\n");

  await sendMail(`🔴 Comus Kritik Hata — ${ts}`, text);
}
