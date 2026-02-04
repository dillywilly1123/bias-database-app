import { Redis } from '@upstash/redis'

const CACHE_KEY = 'key-issues-v1'

// Create Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars)
function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const redis = getRedis()

    if (!redis) {
      // Redis not configured, fall back to static file hint
      return res.status(200).json({
        generatedAt: null,
        topics: [],
        message: 'Redis not configured. Using static fallback.'
      })
    }

    // Try to get from Redis
    const cached = await redis.get(CACHE_KEY)

    if (cached) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      return res.status(200).json(cached)
    }

    // If no cached data, return empty response
    // The generate-key-issues cron job will populate this
    return res.status(200).json({
      generatedAt: null,
      topics: [],
      message: 'No key issues generated yet. Data will be available after the next scheduled generation.'
    })
  } catch (error) {
    console.error('Error fetching key issues:', error)

    return res.status(200).json({
      generatedAt: null,
      topics: [],
      message: 'Error accessing cache. Using static fallback.'
    })
  }
}
