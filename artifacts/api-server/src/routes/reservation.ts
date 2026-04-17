import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { reservations, type Reservation } from "../lib/store.js";
import { broadcast } from "../lib/ws.js";

const router: IRouter = Router();

const VALID_STATUSES: Reservation["status"][] = [
  "pending",
  "confirmed",
  "cancelled",
];

router.post("/", (req: Request, res: Response) => {
  const {
    restaurantId,
    customerName,
    phone,
    date,
    time,
    partySize,
    tablePreference,
    notes,
    customerId,
    status,
  } = req.body as {
    restaurantId?: string;
    customerName?: string;
    phone?: string;
    date?: string;
    time?: string;
    partySize?: number;
    tablePreference?: string;
    notes?: string;
    customerId?: string;
    status?: Reservation["status"];
  };

  if (!restaurantId) {
    res.status(400).json({ success: false, error: "restaurantId is required" });
    return;
  }
  if (!customerName || typeof customerName !== "string") {
    res.status(400).json({ success: false, error: "customerName is required" });
    return;
  }
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ success: false, error: "phone is required" });
    return;
  }
  if (!date || typeof date !== "string") {
    res.status(400).json({ success: false, error: "date is required (YYYY-MM-DD)" });
    return;
  }
  if (!time || typeof time !== "string") {
    res.status(400).json({ success: false, error: "time is required (HH:MM)" });
    return;
  }
  if (!partySize || typeof partySize !== "number" || partySize < 1) {
    res.status(400).json({ success: false, error: "partySize must be a positive number" });
    return;
  }

  const now = new Date().toISOString();
  const reservation: Reservation = {
    reservationId: randomUUID(),
    restaurantId,
    customerName,
    phone,
    date,
    time,
    partySize,
    tablePreference: tablePreference ?? undefined,
    status: VALID_STATUSES.includes(status as Reservation["status"])
      ? (status as Reservation["status"])
      : "pending",
    notes: notes ?? undefined,
    customerId: customerId ?? undefined,
    createdAt: now,
    updatedAt: now,
  };

  reservations.set(reservation.reservationId, reservation);
  broadcast("reservation:created", reservation);

  req.log.info(
    { reservationId: reservation.reservationId, restaurantId, date, time },
    "reservation created",
  );

  res.status(201).json({ success: true, data: reservation });
});

router.get("/", (req: Request, res: Response) => {
  const { restaurantId, date, status } = req.query as {
    restaurantId?: string;
    date?: string;
    status?: string;
  };

  let result = Array.from(reservations.values());

  if (restaurantId) {
    result = result.filter((r) => r.restaurantId === restaurantId);
  }
  if (date) {
    result = result.filter((r) => r.date === date);
  }
  if (status && VALID_STATUSES.includes(status as Reservation["status"])) {
    result = result.filter((r) => r.status === status);
  }

  result.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
  });

  res.json({ success: true, data: result, total: result.length });
});

router.get("/:reservationId", (req: Request, res: Response) => {
  const reservation = reservations.get(req.params.reservationId);
  if (!reservation) {
    res.status(404).json({ success: false, error: "Reservation not found" });
    return;
  }
  res.json({ success: true, data: reservation });
});

router.patch("/:reservationId", (req: Request, res: Response) => {
  const reservation = reservations.get(req.params.reservationId);
  if (!reservation) {
    res.status(404).json({ success: false, error: "Reservation not found" });
    return;
  }

  const { customerName, phone, date, time, partySize, tablePreference, notes, status, customerId } =
    req.body as Partial<Reservation>;

  if (customerName !== undefined) reservation.customerName = customerName;
  if (phone !== undefined) reservation.phone = phone;
  if (date !== undefined) reservation.date = date;
  if (time !== undefined) reservation.time = time;
  if (partySize !== undefined) reservation.partySize = partySize;
  if (tablePreference !== undefined) reservation.tablePreference = tablePreference;
  if (notes !== undefined) reservation.notes = notes;
  if (customerId !== undefined) reservation.customerId = customerId;
  if (status !== undefined && VALID_STATUSES.includes(status)) {
    reservation.status = status;
  }

  reservation.updatedAt = new Date().toISOString();
  reservations.set(reservation.reservationId, reservation);
  broadcast("reservation:updated", reservation);

  req.log.info(
    { reservationId: reservation.reservationId, status: reservation.status },
    "reservation updated",
  );

  res.json({ success: true, data: reservation });
});

router.delete("/:reservationId", (req: Request, res: Response) => {
  if (!reservations.has(req.params.reservationId)) {
    res.status(404).json({ success: false, error: "Reservation not found" });
    return;
  }
  reservations.delete(req.params.reservationId);
  req.log.info({ reservationId: req.params.reservationId }, "reservation deleted");
  res.json({ success: true, message: "Reservation deleted." });
});

export default router;
