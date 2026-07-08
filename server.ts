import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Import API Routers
import authRouter from "./server/routes/auth";
import stocksRouter from "./server/routes/stocks";
import portfolioRouter from "./server/routes/portfolio";
import aiRouter from "./server/routes/ai";
import notificationsRouter from "./server/routes/notifications";
import adminRouter from "./server/routes/admin";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Express JSON parser limit (important for CSV and image transfers)
  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/stocks", stocksRouter);
  app.use("/api/portfolio", portfolioRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/admin", adminRouter);

  // Serve static UI assets or mount Vite Developer Middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {}
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file distribution...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve build static files
    app.use(express.static(distPath));
    
    // SPA Fallback: send index.html for any unhandled routes
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StockPilot is cruising at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to launch StockPilot server", err);
});
