import express from "express";
import multer from "multer";
import { uploadFile, getFiles } from "../controllers/file.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage uploads
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication middleware to all file routes
router.use(auth);

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);

export default router;
