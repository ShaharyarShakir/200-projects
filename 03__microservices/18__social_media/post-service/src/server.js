import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger.util.js';
import  errorHandler from './middleware/errorhandler.middleware.js';
import postRoutes from './routes/post.routes.js';
import connectDB from './db/db.js';
import {connectRabbitMQ} from './utils/rabbitmq.util.js';
dotenv.config();

const app = express()
const port = process.env.PORT || 3002
const redisClient = new Redis(process.env.REDIS_URI)
// conect to database
connectDB()

//middlewares
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})

// routes
app.use('/api/posts', (req,res,next)=>{
    req.redisClient = redisClient
    next()
},postRoutes)
app.use(errorHandler)

const startServer = async() => {
    try {
await connectRabbitMQ()
// listen to server
app.listen(port, () => {
    logger.info(`Post service listening at http://localhost:${port}`)
})

    } catch (e) {
        logger.error(`Failed to connect to server ${e}`)
    process.exit(1)
    }
}
startServer()


process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    // Application specific logging, throwing an error, or other logic here
});
