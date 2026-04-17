import { Router, type IRouter, type Request, type Response } from "express";
import { notifications, createNotification, type Notification } from "../lib/store.js";

const router: IRouter = Router();

router.post("/", (req: Request, res: Response) => {
  const { type, restaurantId, tableNumber, message, priority } = req.body as {
    type?: Notification["type"];
    restaurantId?: string;
    message?: string;
    tableNumber?: string | number;
    priority?: Notification["priority"];
  };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (!message || typeof message !== "string") {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }

  const validTypes: Notification["type"][] = [
    "order_ready", "assistance_needed", "special_request", "alert",
  ];
  const validPriorities: Notification["priority"][] = ["low", "medium", "high"];

  const notification = createNotification({
    type: validTypes.includes(type as Notification["type"])
      ? (type as Notification["type"])
      : "alert",
    restaurantId,
    tableNumber: tableNumber ?? undefined,
    message,
    priority: validPriorities.includes(priority as Notification["priority"])
      ? (priority as Notification["priority"])
      : "medium",
  });

  req.log.info(
    { notificationId: notification.id, type: notification.type, restaurantId },
    "staff notification sent",
  );

  res.status(201).json({
    success: true,
    data: {
      notificationId: notification.id,
      status: "delivered",
      message: "Staff has been notified.",
      notification,
    },
  });
});

router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: notifications.slice().reverse(),
    total: notifications.length,
  });
});

export default router;
