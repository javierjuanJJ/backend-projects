/**
 * @file services/queueService.js
 * @description RabbitMQ producer and consumer for async image transformation jobs.
 * Uses a durable queue with manual acknowledgement to prevent job loss.
 */
import amqplib from 'amqplib'
import { QUEUE_NAME } from '../config.js'

let connection = null
let channel    = null

// ── Connection management ─────────────────────────────────────────────────────

/**
 * Get (or create) the shared channel.
 * Reconnects automatically if the channel has been closed.
 */
async function getChannel() {
  if (channel) return channel

  connection = await amqplib.connect(process.env.RABBITMQ_URL)

  connection.on('error', (err) => {
    console.error('RabbitMQ connection error:', err.message)
    channel    = null
    connection = null
  })

  connection.on('close', () => {
    console.warn('RabbitMQ connection closed')
    channel    = null
    connection = null
  })

  channel = await connection.createChannel()

  // Declare a durable queue — survives broker restarts
  await channel.assertQueue(QUEUE_NAME, { durable: true })

  return channel
}

/**
 * Gracefully close the RabbitMQ connection (call on process exit).
 */
export async function closeQueue() {
  try {
    await channel?.close()
    await connection?.close()
    channel    = null
    connection = null
  } catch {
    // ignore cleanup errors
  }
}

// ── Producer ──────────────────────────────────────────────────────────────────

/**
 * Publish an image transformation job to the queue.
 * @param {object} payload - Job payload (see imageService.processImageJob)
 */
export async function publishTransformJob(payload) {
  const ch = await getChannel()
  const ok = ch.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }, // message survives broker restart
  )

  if (!ok) {
    throw new Error('Failed to publish job — channel write buffer is full')
  }
}

// ── Consumer ──────────────────────────────────────────────────────────────────

/**
 * Start consuming jobs from the queue.
 * @param {(payload: object) => Promise<void>} processor - Async function to handle each job
 */
export async function startConsumer(processor) {
  const ch = await getChannel()

  // Process one job at a time per consumer instance
  ch.prefetch(1)

  ch.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return

    let payload
    try {
      payload = JSON.parse(msg.content.toString())
    } catch {
      console.error('Could not parse queue message — discarding')
      ch.nack(msg, false, false) // dead-letter, don't requeue
      return
    }

    try {
      await processor(payload)
      ch.ack(msg) // job completed successfully
    } catch (err) {
      console.error('Job processor threw — nacking:', err.message)
      ch.nack(msg, false, false) // move to dead-letter queue, don't requeue
    }
  })

  console.log(`✅ Consuming from queue: ${QUEUE_NAME}`)
}
