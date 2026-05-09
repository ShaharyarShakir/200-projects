import logger from "../utils/logger.util.js";
import Search from "../models/search.model.js";

export const handlePostCreated = async(event) => {
    try {
        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.content,
            createdAt: event.createdAt
        }
    )
    await newSearchPost.save()
    logger.info(`Search Post created: ${event.postId}, ${newSearchPost._id}`)

    } catch (e) {
        logger.error("Error handling post created event", e)

    }
}

export const handlePostDeleted = async(event) => {
try {

    await Search.findOneAndDelete({postId: event.postId})
    logger.info(`Search Post deleted: ${event.postId}`)
} catch (error) {
    logger.error("Error handling post deleted event", error)
}
}
