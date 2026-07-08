import { Router } from "express";
import { getDb, saveDb } from "../db";
import { getLivePrice } from "./stocks";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// GET all user alerts and trigger checks
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ alerts: user.alerts || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// CREATE price alert
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { type, ticker, targetPrice, condition } = req.body;
    if (!type || (type === "PRICE" && (!ticker || !targetPrice || !condition))) {
      res.status(400).json({ error: "Alert type, stock ticker, target price, and condition (ABOVE/BELOW) are required." });
      return;
    }

    const uppercaseTicker = ticker ? ticker.toUpperCase() : undefined;
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const newAlert = {
      id: "alert-" + Math.random().toString(36).substr(2, 9),
      type: type as "PRICE" | "NEWS" | "AI",
      ticker: uppercaseTicker,
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      condition: condition as "ABOVE" | "BELOW" | undefined,
      active: true,
      message: type === "PRICE" 
        ? `Alert created for ${uppercaseTicker} when price goes ${condition.toLowerCase()} $${targetPrice}.`
        : `Alert created for ${type.toLowerCase()} updates.`,
      date: new Date().toISOString()
    };

    if (!user.alerts) user.alerts = [];
    user.alerts.unshift(newAlert);
    await saveDb(db);

    res.status(201).json({ message: "Alert created successfully.", alert: newAlert });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// TOGGLE active state
router.put("/:id/toggle", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const alert = user.alerts.find((a) => a.id === id);
    if (!alert) {
      res.status(404).json({ error: "Alert not found." });
      return;
    }

    alert.active = !alert.active;
    await saveDb(db);

    res.json({ message: `Alert status toggled to ${alert.active ? "active" : "inactive"}.`, alert });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// DELETE alert
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.alerts = user.alerts.filter((a) => a.id !== id);
    await saveDb(db);

    res.json({ message: "Alert deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// CHECK active alerts in real-time
router.get("/check", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const activePriceAlerts = (user.alerts || []).filter((a) => a.active && a.type === "PRICE");
    const triggeredAlerts: any[] = [];
    let updated = false;

    for (const alert of activePriceAlerts) {
      if (!alert.ticker || alert.targetPrice === undefined || !alert.condition) continue;
      const live = getLivePrice(alert.ticker);
      
      let isTriggered = false;
      if (alert.condition === "ABOVE" && live.price >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === "BELOW" && live.price <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        alert.active = false; // Disable after trigger
        alert.message = `Alert triggered! ${alert.ticker} is currently $${live.price} (Threshold was ${alert.condition.toLowerCase()} $${alert.targetPrice})`;
        triggeredAlerts.push({
          ...alert,
          currentPrice: live.price
        });
        updated = true;
      }
    }

    if (updated) {
      await saveDb(db);
    }

    res.json({ triggeredAlerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
