import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import menuRouter from "./menu.js";
import menuUpdateRouter from "./menu-update.js";
import orderRouter from "./order.js";
import notifyRouter from "./notify.js";
import dashboardRouter from "./dashboard.js";
import customerRouter from "./customer.js";
import reservationRouter from "./reservation.js";
import stockRouter from "./stock.js";
import feedbackRouter from "./feedback.js";
import analyticsRouter from "./analytics.js";
import telegramWebhookRouter from "./telegram-webhook.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/menu/update", menuUpdateRouter);
router.use("/menu", menuRouter);
router.use("/order", orderRouter);
router.use("/notify", notifyRouter);
router.use("/dashboard", dashboardRouter);
router.use("/customer", customerRouter);
router.use("/reservation", reservationRouter);
router.use("/stock", stockRouter);
router.use("/feedback", feedbackRouter);
router.use("/analytics", analyticsRouter);
router.use("/telegram", telegramWebhookRouter);

export default router;
