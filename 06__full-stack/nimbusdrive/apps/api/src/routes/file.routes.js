import express from "express";
import multer from "multer";
import { 
  uploadFile, 
  getFiles, 
  getStarredFilesList, 
  getTrashFilesList, 
  downloadFile, 
  previewFile, 
  renameFile, 
  starFile, 
  softDeleteFile, 
  restoreFile, 
  permanentDeleteFile 
} from "../controllers/file.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage uploads
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication middleware to all file routes
router.use(auth);

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);
router.get("/starred", getStarredFilesList);
router.get("/trash", getTrashFilesList);
router.get("/:id/download", downloadFile);
router.get("/:id/preview", previewFile);
router.patch("/:id/rename", renameFile);
router.patch("/:id/star", starFile);
router.delete("/:id", softDeleteFile);
router.delete("/:id/permanent", permanentDeleteFile);
router.post("/:id/restore", restoreFile);

export default router;
