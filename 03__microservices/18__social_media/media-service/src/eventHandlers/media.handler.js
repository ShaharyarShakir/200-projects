import logger from "../utils/logger.util.js"
import Media from "../models/media.model.js"
import { deleteFromCloudinary } from "../utils/cloudinary.util.js";
const handlePostDelete = async(event) => {
    console.log(event, "event");
    const {postId, mediaIds } = event
try {
const mediaToDelete = await Media.find({ _id: {$in: mediaIds}})
for (const media of mediaToDelete) {
    await deleteFromCloudinary(media.publicId)
    await Media.findByIdAndDelete(media._id)
    logger.info(`Deleted media ${media._id} from cloudinary and database with post ${postId}`)
}
logger.info(`Deletion completed of ${postId}`)
} catch (e) {
    logger.error(e, "Error occured while deleting the media")
}

}
export default handlePostDelete
