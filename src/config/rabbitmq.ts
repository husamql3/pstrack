import amqp from 'amqplib'
import { env } from './env.mjs'

type RabbitMQConnection = {
  connection: amqp.ChannelModel
  channel: amqp.Channel
}

/**
 * Initializes a connection to RabbitMQ and creates a channel for the specified queue
 *
 * @param queueName - The name of the queue to assert
 * @returns A promise resolving to a RabbitMQConnection object with the connection and channel
 * @throws Error if RABBITMQ_URL is not defined or if connection fails
 */
export const initRabbitMQ = async (queueName: string): Promise<RabbitMQConnection> => {
  const connection = await amqp.connect(env.RABBITMQ_URL)

  const channel = await connection.createChannel()
  await channel.assertQueue(queueName, { durable: true })

  return {
    connection,
    channel,
  }
}
