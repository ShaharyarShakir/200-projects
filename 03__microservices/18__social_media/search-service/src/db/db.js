import mogoose from "mongoose"
import logger from '../utils/logger.util.js';

const connectDB = async () => {
    try {
        await mogoose.connect(process.env.MONGODB_URI)
        logger.info("Connected to MongoDB")
    } catch (e) {
        logger.error("Error connecting to MongoDB", e)
        process.exit(1)
    }
}
export default connectDB
