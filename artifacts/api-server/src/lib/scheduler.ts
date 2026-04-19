import { sendDailyReport, sendWeeklyReport } from "./emailSender.js";

let _lastDailyDate  = "";
let _lastWeeklyDate = "";

function pad(n: number) { return n.toString().padStart(2, "0"); }

function checkSchedule() {
  const now   = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const HH    = pad(now.getHours());
  const mm    = pad(now.getMinutes());
  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const weekKey = `${dateKey}-weekly`;

  if (HH === "23" && mm === "00" && _lastDailyDate !== dateKey) {
    _lastDailyDate = dateKey;
    console.log("[Scheduler] Running daily report...");
    sendDailyReport().catch((err) => console.error("[Scheduler] Daily report error:", err));
  }

  const isMonday = now.getDay() === 1;
  if (isMonday && HH === "09" && mm === "00" && _lastWeeklyDate !== weekKey) {
    _lastWeeklyDate = weekKey;
    console.log("[Scheduler] Running weekly report...");
    sendWeeklyReport().catch((err) => console.error("[Scheduler] Weekly report error:", err));
  }
}

export function startScheduler(): void {
  setInterval(checkSchedule, 60_000);
  console.log("[Scheduler] Started — daily 23:00, weekly Monday 09:00 (Istanbul)");
}
