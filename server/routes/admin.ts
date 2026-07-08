import { Router } from "express";
import { getDb, saveDb, Feedback } from "../db";
import { adminMiddleware, authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// PUBLIC: Submit Contact Feedback form
router.post("/feedback", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required." });
      return;
    }

    const db = await getDb();
    const newFeedback: Feedback = {
      id: "fb-" + Math.random().toString(36).substr(2, 9),
      name,
      email,
      message,
      date: new Date().toISOString()
    };

    db.feedbacks.unshift(newFeedback);
    await saveDb(db);

    res.status(201).json({ message: "Thank you for your feedback! Our team has received your message." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ADMIN: Get Admin Dashboard Metrics
router.get("/metrics", adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    
    const totalUsers = db.users.filter((u) => u.role !== "admin").length;
    const totalAdmins = db.users.filter((u) => u.role === "admin").length;
    const totalTrades = db.transactions.length;
    const feedbackCount = db.feedbacks.length;

    // Calculate total investment and average user portfolio sizes
    const userPortfolios: Record<string, number> = {};
    db.transactions.forEach((tx) => {
      if (!userPortfolios[tx.userId]) userPortfolios[tx.userId] = 0;
      if (tx.type === "BUY") {
        userPortfolios[tx.userId] += tx.shares * tx.price;
      } else {
        userPortfolios[tx.userId] -= tx.shares * tx.price;
      }
    });

    const activePortfolios = Object.values(userPortfolios).filter((v) => v > 0);
    const totalCapitalInvested = activePortfolios.reduce((a, b) => a + b, 0);
    const avgPortfolioValue = activePortfolios.length > 0 ? totalCapitalInvested / activePortfolios.length : 0;

    res.json({
      metrics: {
        totalUsers,
        totalAdmins,
        totalTrades,
        feedbackCount,
        totalCapitalInvested: Number(totalCapitalInvested.toFixed(2)),
        avgPortfolioValue: Number(avgPortfolioValue.toFixed(2))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ADMIN: List all registered users
router.get("/users", adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const usersList = db.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      verified: u.verified,
      watchlistCount: u.watchlist.length,
      alertsCount: (u.alerts || []).length
    }));
    res.json({ users: usersList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ADMIN: List all feedbacks
router.get("/feedbacks", adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    res.json({ feedbacks: db.feedbacks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ADMIN: Change user role or block user
router.put("/users/:id/role", adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (role !== "user" && role !== "admin") {
      res.status(400).json({ error: "Invalid role. Role must be 'user' or 'admin'." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.role = role;
    await saveDb(db);

    res.json({ message: `Successfully updated user role to ${role}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
