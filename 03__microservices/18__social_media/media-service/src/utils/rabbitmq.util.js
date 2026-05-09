import ampq from "amqplib"
import logger from "../utils/logger.util.js"

let connection = null
let channel = null
const EXCHANGE_NAME = "shakir_events"

export const connectRabbitMQ = async () => {
    try {
        connection = await ampq.connect(process.env.RABBITMQ_URI)
        channel = await connection.createChannel()
         await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true  })
         logger.info("Connected to RabbitMQ")
}
     catch (e) {
        logger.error("Error connecting to RabbitMQ", e)
    }
}

export const publishEvent = async (routingKey, message) => {
    if(!channel){
        await connectRabbitMQ()
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    logger.info(`Published event to ${routingKey}`)
}

export const consumeEvent = async (routingKey, callback) => {
if (!channel) await connectRabbitMQ()
const q = await channel.assertQueue("", { exclusive: true })
await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)
channel.consume(q.queue, (msg) => {
    if(msg!== null){
        const content = JSON.parse(msg.content.toString())
        callback(content)
        channel.ack(msg)
    }
})
logger.info(`Subscribed to event: ${routingKey}`)
}

