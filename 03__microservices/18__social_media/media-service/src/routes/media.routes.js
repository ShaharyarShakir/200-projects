import express from "express"
import multer from "multer"
import { getAllMedia, uploadMedia } from "../controllers/media.controller.js"
import logger from "../utils/logger.util.js"
import {authenticateRequest } from "../middleware/auth.middleware.js"

const router = express.Router()

// configure multer
const upload = multer ({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5
    }
}).single('file')

router.post("/upload", authenticateRequest, (req, res, next) => {
    upload(req, res, (err) => {
        if(err instanceof multer.MulterError){
            logger.error("Multer error", err)
             return res.status(400).json({
                success: false,
                message: "File too large",
                error: err.message,
                stack: err.stack
            })
        } else if(err){
            logger.error("Unknown error", err)
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: err.message,
                stack: err.stack
            })
        }
        if(!req.file){
            logger.error("No file uploaded")
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            })
        }
        next()
    })
}, uploadMedia)
router.get("/get-all", authenticateRequest, getAllMedia)

export default router
