import { Router, Response } from "express";
import { getDb, saveDb, User } from "../db";
import { hashPassword, verifyPassword, generateToken } from "../utils/crypto";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

// Help register a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }

    const db = await getDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }

    // Generate numeric verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: User = {
      id: "user-" + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      role: "user",
      verified: false,
      verificationCode,
      watchlist: ["AAPL", "MSFT", "GOOG"],
      alerts: []
    };

    db.users.push(newUser);
    await saveDb(db);

    // Return the user along with code for quick client verification
    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      userId: newUser.id,
      email: newUser.email,
      verificationCode // Exposing verificationCode for high-fidelity demo/sandbox simulation!
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Email verification
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: "Email and verification code are required." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (user.verified) {
      res.status(200).json({ message: "Email is already verified." });
      return;
    }

    if (user.verificationCode !== code) {
      res.status(400).json({ error: "Invalid verification code." });
      return;
    }

    user.verified = true;
    user.verificationCode = undefined;
    await saveDb(db);

    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.status(200).json({
      message: "Email verified successfully.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        watchlist: user.watchlist,
        profileImage: user.profileImage
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Login user/admin
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        watchlist: user.watchlist,
        profileImage: user.profileImage
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(404).json({ error: "User with this email does not exist." });
      return;
    }

    // Generate random 6 digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    await saveDb(db);

    res.status(200).json({
      message: "Password reset code sent.",
      email: user.email,
      resetCode // Exposing resetCode for high-fidelity interactive sandbox
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: "Email, code, and new password are required." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (user.resetCode !== code) {
      res.status(400).json({ error: "Invalid password reset code." });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    user.resetCode = undefined;
    await saveDb(db);

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Get User Profile
router.get("/profile", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        watchlist: user.watchlist,
        profileImage: user.profileImage,
        alerts: user.alerts
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Change Password
router.post("/change-password", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: "Current and new passwords are required." });
      return;
    }

    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (!verifyPassword(oldPassword, user.passwordHash)) {
      res.status(400).json({ error: "Incorrect current password." });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    await saveDb(db);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Update Profile details
router.post("/update-profile", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, profileImage } = req.body;
    const db = await getDb();
    const user = db.users.find((u) => u.id === req.user?.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;

    await saveDb(db);

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        watchlist: user.watchlist,
        profileImage: user.profileImage
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
