import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  getActivities
} from "../controllers/project.controller.js";

const router = express.Router();

// All project routes require authentication
router.use(protect);

// Project Core CRUD endpoints
router.post("/", create);
router.get("/workspace/:workspaceId", getAll);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id", remove);

// Project Membership & Activity endpoints
router.post("/:id/members", addProjectMember);
router.delete("/:id/members/:userId", removeProjectMember);
router.patch("/:id/members", updateProjectMemberRole);
router.get("/:id/activities", getActivities);

export default router;
