import { Router } from "express";
import { searchPost } from "../controllers/search.controller.js";
import {authenticateRequest} from "../middleware/auth.middleware.js"

const router = Router()
router.use(authenticateRequest)
router.get("/posts", searchPost)

export default router
