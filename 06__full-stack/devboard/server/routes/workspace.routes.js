import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  create,
  getAll,
  getOne
} from "../controllers/workspace.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);

export default router;
