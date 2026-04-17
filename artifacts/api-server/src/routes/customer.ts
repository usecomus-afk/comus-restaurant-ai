import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { customers, type Customer, type Visit } from "../lib/store.js";

const router: IRouter = Router();

router.post("/", (req: Request, res: Response) => {
  const { restaurantId, name, phone, email, allergies, preferences, notes } =
    req.body as {
      restaurantId?: string;
      name?: string;
      phone?: string;
      email?: string;
      allergies?: string[];
      preferences?: string[];
      notes?: string;
    };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (!name || typeof name !== "string") {
    res.status(400).json({ success: false, error: "name is required" });
    return;
  }
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ success: false, error: "phone is required" });
    return;
  }

  const existing = Array.from(customers.values()).find(
    (c) => c.restaurantId === restaurantId && c.phone === phone,
  );
  if (existing) {
    res.status(409).json({
      success: false,
      error: "A customer with this phone number already exists.",
      customerId: existing.customerId,
    });
    return;
  }

  const now = new Date().toISOString();
  const customer: Customer = {
    customerId: randomUUID(),
    restaurantId,
    name,
    phone,
    email: email ?? undefined,
    allergies: Array.isArray(allergies) ? allergies : [],
    preferences: Array.isArray(preferences) ? preferences : [],
    notes: notes ?? undefined,
    visitHistory: [],
    createdAt: now,
    updatedAt: now,
  };

  customers.set(customer.customerId, customer);

  req.log.info({ customerId: customer.customerId, restaurantId }, "customer created");

  res.status(201).json({ success: true, data: customer });
});

router.get("/", (req: Request, res: Response) => {
  const { restaurantId, search } = req.query as {
    restaurantId?: string;
    search?: string;
  };

  let result = Array.from(customers.values());

  if (restaurantId) {
    result = result.filter((c) => c.restaurantId === restaurantId);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }

  res.json({ success: true, data: result, total: result.length });
});

router.get("/:customerId", (req: Request, res: Response) => {
  const customer = customers.get(req.params.customerId);
  if (!customer) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }
  res.json({ success: true, data: customer });
});

router.patch("/:customerId", (req: Request, res: Response) => {
  const customer = customers.get(req.params.customerId);
  if (!customer) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }

  const { name, phone, email, allergies, preferences, notes } = req.body as Partial<Customer>;

  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (email !== undefined) customer.email = email;
  if (allergies !== undefined) customer.allergies = allergies;
  if (preferences !== undefined) customer.preferences = preferences;
  if (notes !== undefined) customer.notes = notes;
  customer.updatedAt = new Date().toISOString();

  customers.set(customer.customerId, customer);

  req.log.info({ customerId: customer.customerId }, "customer updated");

  res.json({ success: true, data: customer });
});

router.post("/:customerId/visit", (req: Request, res: Response) => {
  const customer = customers.get(req.params.customerId);
  if (!customer) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }

  const { tableNumber, orderIds, notes } = req.body as {
    tableNumber?: string | number;
    orderIds?: string[];
    notes?: string;
  };

  const visit: Visit = {
    visitId: randomUUID(),
    date: new Date().toISOString(),
    tableNumber: tableNumber ?? undefined,
    orderIds: Array.isArray(orderIds) ? orderIds : [],
    notes: notes ?? undefined,
  };

  customer.visitHistory.push(visit);
  customer.updatedAt = new Date().toISOString();
  customers.set(customer.customerId, customer);

  req.log.info(
    { customerId: customer.customerId, visitId: visit.visitId },
    "visit recorded",
  );

  res.status(201).json({ success: true, data: { visit, customer } });
});

router.delete("/:customerId", (req: Request, res: Response) => {
  const exists = customers.has(req.params.customerId);
  if (!exists) {
    res.status(404).json({ success: false, error: "Customer not found" });
    return;
  }
  customers.delete(req.params.customerId);
  req.log.info({ customerId: req.params.customerId }, "customer deleted");
  res.json({ success: true, message: "Customer deleted." });
});

export default router;
