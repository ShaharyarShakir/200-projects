import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  create,
  getAll,
  update,
  remove
} from "../controllers/task.controller.js";

const router = express.Router();

// Protect all task endpoints
router.use(protect);

// Task routes
router.post("/", create);
router.get("/project/:projectId", getAll);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
