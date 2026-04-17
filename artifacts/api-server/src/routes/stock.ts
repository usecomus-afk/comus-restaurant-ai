import { Router, type IRouter, type Request, type Response } from "express";
import { stock, type StockItem } from "../lib/store.js";
import { broadcast } from "../lib/ws.js";

const router: IRouter = Router();

router.post("/", (req: Request, res: Response) => {
  const { restaurantId, dishId, dishName, available, reason, updatedBy } =
    req.body as {
      restaurantId?: string;
      dishId?: string;
      dishName?: string;
      available?: boolean;
      reason?: string;
      updatedBy?: string;
    };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (!dishId || typeof dishId !== "string") {
    res.status(400).json({ success: false, error: "dishId is required" });
    return;
  }
  if (typeof available !== "boolean") {
    res.status(400).json({ success: false, error: "available (boolean) is required" });
    return;
  }

  const key = `${restaurantId}:${dishId}`;
  const existing = stock.get(key);

  const item: StockItem = {
    dishId,
    dishName: dishName ?? existing?.dishName ?? dishId,
    restaurantId,
    available,
    reason: available ? undefined : (reason ?? undefined),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy ?? undefined,
  };

  stock.set(key, item);
  broadcast("stock:updated", item);

  req.log.info(
    { dishId, restaurantId, available },
    available ? "dish marked available" : "dish marked out of stock",
  );

  res.status(200).json({ success: true, data: item });
});

router.get("/", (req: Request, res: Response) => {
  const { restaurantId, available } = req.query as {
    restaurantId?: string;
    available?: string;
  };

  let result = Array.from(stock.values());

  if (restaurantId) {
    result = result.filter((s) => s.restaurantId === restaurantId);
  }

  if (available !== undefined) {
    const wantAvailable = available === "true";
    result = result.filter((s) => s.available === wantAvailable);
  }

  result.sort((a, b) => a.dishName.localeCompare(b.dishName));

  res.json({
    success: true,
    data: result,
    total: result.length,
    outOfStock: result.filter((s) => !s.available).length,
  });
});

router.get("/:dishId", (req: Request, res: Response) => {
  const { restaurantId } = req.query as { restaurantId?: string };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId query param is required" });
    return;
  }

  const key = `${restaurantId}:${req.params.dishId}`;
  const item = stock.get(key);

  if (!item) {
    res.json({
      success: true,
      data: { dishId: req.params.dishId, restaurantId, available: true, note: "No stock record — assumed available" },
    });
    return;
  }

  res.json({ success: true, data: item });
});

export default router;
