import {v2 as cloudinary} from "cloudinary"
import logger from "../utils/logger.util.js"
cloudinary.config({
    cloud_name:process.env.cloud_name,
    api_key:process.env.api_key,
    api_secret:process.env.api_secret
})

export const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject)=> {
        const uploadStream= cloudinary.uploader.upload_stream({
            resource_type: 'auto'
        },
    (error, result) => {
        if(error){
            logger.error("Error uploading the media", error)
            reject(error)
        } else {
            resolve(result)
        }
    }
    )
    uploadStream.end(file.buffer)
    })
}
export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        logger.info("Media deleted successfully from cloud", publicId)
        return result
    } catch (error) {
        logger.error("Error deleting the media", error)
        throw error
    }
}
