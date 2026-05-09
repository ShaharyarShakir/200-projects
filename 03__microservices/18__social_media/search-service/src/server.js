import dotenv from "dotenv"
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger.util.js';
import  errorHandler from './middleware/errorhandler.middleware.js';
import express from 'express';
import connectDB from './db/db.js';
import {connectRabbitMQ, consumeEvent } from './utils/rabbitmq.util.js';
import searchRouter from './routes/search.router.js';
import { handlePostCreated, handlePostDeleted } from "./eventhandlers/search.handler.js";
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
app.use("/api/search", searchRouter)
app.use(errorHandler)
const startServer = async () => {
    try {
        await connectRabbitMQ()
        await consumeEvent('post.created', handlePostCreated)
        await consumeEvent('post.deleted', handlePostDeleted)
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`)
        })
    } catch (error) {
        logger.error('Error starting server:', error)
    }
}

startServer()
