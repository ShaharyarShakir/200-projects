import dotenv  from "dotenv"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import mediaRoutes from "./routes/media.routes.js"
import errorHandler from "./middleware/errorhandler.middleware.js"
import logger from "./utils/logger.util.js"
import {connectRabbitMQ, consumeEvent} from './utils/rabbitmq.util.js';
import handlePostDelete from "./eventHandlers/media.handler.js"
import connectDB from "./db/db.js"
dotenv.config();

const app = express()
const port = process.env.PORT || 3002

// connect to database
connectDB()

// middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})

app.use("/api/media", mediaRoutes)
app.use(errorHandler)

const startServer = async() => {
    try {
        await connectRabbitMQ()
        await consumeEvent("post.deleted", handlePostDelete)
app.listen(port, () => {
    logger.info(`Post service listening at http://localhost:${port}`)
})
    } catch (e) {
        logger.error(`Failed to connect to server ${e}`)
    }
}

startServer()

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    // Application specific logging, throwing an error, or other logic here
});

