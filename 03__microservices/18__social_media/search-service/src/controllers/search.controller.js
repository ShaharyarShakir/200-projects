import logger from "../utils/logger.util.js";
import Serach from "../models/search.model.js"
export const searchPost = async (req, res) => {
    try {
logger.info("Searching the post")
        const { query } = req.query
        const result = await Serach.find({
            $text: { $search: query }
        },
    {
        score: { $meta: "textScore" }
    }
    ).sort({ score: { $meta: "textScore" } }).limit(10)
res.status(200).json({
            success: true,
            data: result
        })
    } catch (e) {
        logger.error("Error searching the post", e)
        res.status(500).json({
            success: false,
             message: "Error searching the post" })
    }
}
