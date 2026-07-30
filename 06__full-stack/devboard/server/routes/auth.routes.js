import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public auth endpoints
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected auth endpoints
router.get("/me", protect, getMe);

export default router;
