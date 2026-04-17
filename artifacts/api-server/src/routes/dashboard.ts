import { Router, type IRouter, type Request, type Response } from "express";
import { orders, customers, notifications } from "../lib/store.js";

const router: IRouter = Router();

router.get("/:restaurantId", (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  const allOrders = Array.from(orders.values()).filter(
    (o) => o.restaurantId === restaurantId,
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = allOrders.filter((o) => o.createdAt.startsWith(today));

  const dishCounts: Record<string, { name: string; count: number }> = {};
  for (const order of todayOrders) {
    for (const item of order.items) {
      if (!dishCounts[item.dishId]) {
        dishCounts[item.dishId] = { name: item.dishName, count: 0 };
      }
      dishCounts[item.dishId].count += item.quantity;
    }
  }

  const popularDishes = Object.entries(dishCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([dishId, { name, count }]) => ({ dishId, name, count }));

  const activeTables = new Set(
    todayOrders
      .filter((o) => o.status !== "served")
      .map((o) => String(o.tableNumber)),
  ).size;

  const totalRevenue = todayOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce(
        (s, item) => s + item.quantity * (item.unitPrice ?? 0),
        0,
      )
    );
  }, 0);

  const totalCustomers = Array.from(customers.values()).filter(
    (c) => c.restaurantId === restaurantId,
  ).length;

  const recentNotifications = notifications
    .filter((n) => n.restaurantId === restaurantId)
    .slice(-5)
    .reverse();

  req.log.info({ restaurantId }, "dashboard fetched");

  res.json({
    success: true,
    data: {
      restaurantId,
      date: today,
      totalOrdersToday: todayOrders.length,
      totalOrdersAllTime: allOrders.length,
      activeTables,
      estimatedRevenueToday: totalRevenue,
      popularDishesToday: popularDishes,
      totalRegisteredCustomers: totalCustomers,
      orderStatusBreakdown: {
        received: todayOrders.filter((o) => o.status === "received").length,
        preparing: todayOrders.filter((o) => o.status === "preparing").length,
        ready: todayOrders.filter((o) => o.status === "ready").length,
        served: todayOrders.filter((o) => o.status === "served").length,
      },
      recentNotifications,
    },
  });
});

export default router;
