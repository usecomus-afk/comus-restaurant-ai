import { Router, type IRouter, type Request, type Response } from "express";
import { menus } from "../lib/store.js";

const router: IRouter = Router();

router.get("/:restaurantId", (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const menu = menus.get(restaurantId) ?? menus.get("default");
  res.json({ success: true, data: menu });
});

export default router;
