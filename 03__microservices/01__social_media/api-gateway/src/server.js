import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import Redis from "ioredis"
import { rateLimit } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import logger from "./utils/logger.util.js"
import proxy from "express-http-proxy"
import errorHandler from "./middleware/errorhandler.middleware.js"
import validateToken from "./middleware/auth.middleware.js"
dotenv.config()
const app = express()
const port = process.env.PORT || 3000
const redisClient = new Redis(process.env.REDIS_URI)
app.use(helmet())
app.use(cors())
app.use(express.json())

// rate limiting

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
app.use(rateLimiter)

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})


const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`)
        res.status(500).send({ success: false, message: "Internal server error", error: err.message })
    }
}
// setting up proxy for auth

app.use("/v1/auth", proxy(process.env.IDENTITY_SERVICE_URI, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response receive from identity service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use(errorHandler)

// setting up proxy for post service
app.use("/v1/posts", validateToken, proxy(process.env.POST_SERVICE_URI, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
        return proxyReqOpts
    },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response receive from Post service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))
//setting up proxy for media service
app.use("/v1/media", validateToken, proxy(process.env.MEDIA_SERVICE_URI, {
     ...proxyOptions,
        parseReqBody: false,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
       proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
      if(!srcReq.headers["content-type"].startsWith("multipart/form-data")){
        proxyReqOpts.headers["Content-Type"] = "application/json"
      }
        return proxyReqOpts
    },
     userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response receive from Post service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

// setting up proxy for s seearch service
app.use("/v1/search", validateToken, proxy(process.env.SEARCH_SERVICE_URI, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
        return proxyReqOpts
    },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response receive from SEARCH service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

// server is listening
app.listen(port, () => {
logger.info(`API Gateway server is running on port ${port}`)
logger.info(`Identity Service server is running on port ${process.env.IDENTITY_SERVICE_URI}`)
logger.info(`Post Service server is running on port ${process.env.POST_SERVICE_URI}`)
logger.info(`Media Service server is running on port ${process.env.MEDIA_SERVICE_URI}`)
logger.info(`Search Service server is running on port ${process.env.SEARCH_SERVICE_URI}`)
logger.info(`Redis URl: ${process.env.REDIS_URI}`)
})
