import dotenv from "dotenv"
dotenv.config()
import express from "express"
import connectDB from "./db/db.js"
import helmet from "helmet"
import cors from "cors"
import logger from './utils/logger.util.js'
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis"
import { rateLimit } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import identityRouter from "./routes/idetity-service.route.js"
import errorHandler from "./middleware/erroHandler.middleware.js"
const app = express()
const port = process.env.PORT || 3001
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

// DDos protection && rate limiting (using rate-limiter-flexible)
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1,
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next()
        })
        .catch(() => {
            logger.warn(`Too many requests from ${req.ip}`)
            res.status(429).send({ success: false, message: "Too many requests" })
        })
})

// ip based rate limiting
const endpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Too many requests from ${req.ip}`)
        res.status(429).send({ success: false, message: "Too many requests" })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    }),
})

// apply endpoint limiter to routes
app.use("/api/auth/register", endpointLimiter)

// routes
app.use("/api/auth", identityRouter)

// error handler
app.use(errorHandler)

// listening to port
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
})

process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`)

})
