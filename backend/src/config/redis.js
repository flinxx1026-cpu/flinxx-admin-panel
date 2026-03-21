import { createClient } from 'redis'

let redisClient = null

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  console.log(`🔗 Connecting to Redis: ${redisUrl}`)

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000, // 10 second timeout to avoid infinite hang
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Max reconnection attempts reached (10)')
            return new Error('Max redis retries.')
          }
          return Math.min(retries * 100, 3000) // backoff up to 3s
        }
      }
    })

    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message)
    })

    client.on('connect', () => {
      console.log(`✅ Redis Client Connected to ${redisUrl}`)
    })

    client.on('ready', () => {
      console.log('✅ Redis Client Ready')
    })

    await client.connect()
    redisClient = client
    return client
  } catch (error) {
    console.error('❌ Redis Connection Error:', error.message)
    console.log('⚠️  Starting without Redis - will use database fallback')
    return null
  }
}

export const getRedisClient = () => {
  return redisClient
}

export const isRedisConnected = () => {
  return redisClient !== null && redisClient.isOpen
}
