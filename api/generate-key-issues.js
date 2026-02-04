import { Redis } from '@upstash/redis'
import Anthropic from '@anthropic-ai/sdk'
import { aggregateContent } from './lib/aggregate-content.js'

const CACHE_KEY = 'key-issues-v1'
const CACHE_TTL = 60 * 60 * 24 // 24 hours

// Create Redis client
function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  })
}

export default async function handler(req, res) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Fetch commentator data
    const dataResponse = await fetch(`${getBaseUrl(req)}/data.json`)
    if (!dataResponse.ok) {
      throw new Error('Failed to fetch commentator data')
    }
    const commentators = await dataResponse.json()

    // Aggregate recent content from RSS feeds
    console.log('Aggregating content from RSS feeds...')
    const aggregatedContent = await aggregateContent(commentators)

    // Check if we have enough content to generate meaningful summaries
    const totalArticles =
      aggregatedContent.left.reduce((sum, c) => sum + c.articles.length, 0) +
      aggregatedContent.center.reduce((sum, c) => sum + c.articles.length, 0) +
      aggregatedContent.right.reduce((sum, c) => sum + c.articles.length, 0)

    if (totalArticles < 5) {
      console.log('Not enough recent content to generate key issues')
      return res.status(200).json({
        success: false,
        message: 'Not enough recent content',
        articlesFound: totalArticles
      })
    }

    // Generate key issues using Claude
    console.log('Generating key issues with Claude...')
    const keyIssues = await generateKeyIssues(aggregatedContent)

    // Store in Redis
    const redis = getRedis()
    await redis.set(CACHE_KEY, keyIssues, { ex: CACHE_TTL })

    console.log('Key issues generated and cached successfully')
    return res.status(200).json({
      success: true,
      topicsGenerated: keyIssues.topics.length,
      generatedAt: keyIssues.generatedAt
    })
  } catch (error) {
    console.error('Error generating key issues:', error)
    return res.status(500).json({
      error: 'Failed to generate key issues',
      details: error.message
    })
  }
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${protocol}://${host}`
}

async function generateKeyIssues(aggregatedContent) {
  const client = new Anthropic()

  // Format content for the prompt
  const contentSummary = formatContentForPrompt(aggregatedContent)

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are analyzing recent political commentary content to identify the top 2-3 key issues being discussed across the political spectrum.

Here is a summary of recent articles from political commentators grouped by political lean:

${contentSummary}

Based on this content, identify 2-3 trending political topics that are being discussed across multiple perspectives. For each topic:
1. Give it a concise title (5-10 words)
2. Write a brief description (1 sentence) explaining the context
3. Summarize what LEFT-leaning commentators are saying (2-3 sentences)
4. Summarize what CENTER/moderate commentators are saying (2-3 sentences)
5. Summarize what RIGHT-leaning commentators are saying (2-3 sentences)
6. List 1-2 key voices from each perspective (use actual names from the content when possible)

IMPORTANT: If a perspective doesn't have relevant content on a topic, provide a general summary of what that political lean typically says about such topics.

Respond in this exact JSON format:
{
  "topics": [
    {
      "id": "topic-1",
      "title": "Topic Title Here",
      "description": "Brief context about this issue",
      "perspectives": {
        "left": {
          "summary": "What left-leaning commentators are saying...",
          "keyVoices": ["Name1", "Name2"]
        },
        "center": {
          "summary": "What centrist commentators are saying...",
          "keyVoices": ["Name1"]
        },
        "right": {
          "summary": "What right-leaning commentators are saying...",
          "keyVoices": ["Name1", "Name2"]
        }
      }
    }
  ]
}

Only respond with valid JSON, no other text.`
      }
    ]
  })

  // Parse the response
  const responseText = response.content[0].text
  let parsed

  try {
    parsed = JSON.parse(responseText)
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('Failed to parse Claude response as JSON')
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    topics: parsed.topics.map((topic, index) => ({
      ...topic,
      id: topic.id || `topic-${index + 1}`
    }))
  }
}

function formatContentForPrompt(aggregatedContent) {
  const sections = []

  for (const [category, commentators] of Object.entries(aggregatedContent)) {
    if (commentators.length === 0) continue

    const label = category.toUpperCase()
    const articles = []

    for (const commentator of commentators) {
      for (const article of commentator.articles.slice(0, 3)) {
        articles.push(`- ${commentator.name}: "${article.title}"${article.description ? ` - ${article.description.substring(0, 200)}` : ''}`)
      }
    }

    if (articles.length > 0) {
      sections.push(`## ${label}-LEANING COMMENTATORS\n${articles.join('\n')}`)
    }
  }

  return sections.join('\n\n')
}
