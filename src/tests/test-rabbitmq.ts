import { initRabbitMQ } from '@/config/rabbitmq'

async function testRabbitMQConnection() {
  const queueName = 'test_queue'
  const { connection, channel } = await initRabbitMQ(queueName)
  console.log('Successfully connected to RabbitMQ and asserted queue:', queueName)

  try {
    // Optional: Send a test message to the queue
    const testMessage = { test: 'Hello, RabbitMQ!' }
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(testMessage)), { persistent: true })
    console.log('Sent test message to queue:', testMessage)

    // Optional: Consume the test message to verify
    channel.consume(queueName, (msg) => {
      if (msg !== null) {
        const receivedMessage = JSON.parse(msg.content.toString())
        console.log('Received test message:', receivedMessage)
        channel.ack(msg)
      }
    })
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    // Cleanup after a short delay to allow message consumption
    setTimeout(async () => {
      if (channel)
        await channel.close().catch((err) => console.error('Failed to close channel:', err))
      if (connection)
        await connection.close().catch((err) => console.error('Failed to close connection:', err))
      process.exit(0)
    }, 2000)
  }
}

testRabbitMQConnection()
