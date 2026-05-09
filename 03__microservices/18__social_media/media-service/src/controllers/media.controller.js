import { uploadToCloudinary } from "../utils/cloudinary.util.js"
import logger from "../utils/logger.util.js"
import Media from "../models/media.model.js";

export const uploadMedia = async (req, res ) => {
    logger.info("Starting uploading file")
    try {
        if(!req.file){
            logger.error("No file uploaded")
            return res.status(400).json({
              success: false,
                message: "No file uploaded"
            })
        }
        const {originalname, mimetype, buffer} = req.file
        const userId = req.user.userId
        logger.info(`File details: name=${originalname}, mimeType=${mimetype}`)
        logger.info("Uploading to cloudinary....")
        const cloudinaryUpload = await uploadToCloudinary(req.file)
        logger.info(`File uploaded successfully ${cloudinaryUpload.public_id}`)
        const newMedia = new Media({
            publicId: cloudinaryUpload.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryUpload.secure_url,
            userId: userId
        })
        await newMedia.save()
        res.status(201).json({
            success: true,
            mediaId: newMedia._id,
            message: "Media uploaded successfully",
            url: cloudinaryUpload.secure_url
        })
    } catch (e) {
        logger.error("Error uploading media", e)
        res.status(500).json({
            success: false,
            message: "Error uploading media"
        })
    }
}

export const getAllMedia = async (req, res) => {
    try {
        const userId = req.user.userId
        const media = await Media.find({userId: userId})
        res.status(200).json({
            success: true,
            media
        })
    } catch (e) {
        logger.error("Error getting media", e)
        res.status(500).json({
            success: false,
            message: "Error getting media"
        })
    }
}

