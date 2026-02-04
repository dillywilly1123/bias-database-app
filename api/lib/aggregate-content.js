/**
 * Aggregates content from commentators' RSS feeds (Substack)
 * Groups content by political lean (left, center, right)
 */

// Parse score string to determine political lean
function parseScore(score) {
  if (!score || score === '0') return { value: 0, lean: 'C' }
  const match = score.match(/^(\d+)(D|R)$/i)
  if (!match) return { value: 0, lean: 'C' }
  return { value: parseInt(match[1], 10), lean: match[2].toUpperCase() }
}

// Categorize commentator into left/center/right
function categorizeByLean(score) {
  const { value, lean } = parseScore(score)
  if (lean === 'C' || value < 10) return 'center'
  if (lean === 'D') return 'left'
  if (lean === 'R') return 'right'
  return 'center'
}

// Parse RSS/Atom XML to extract articles
function parseRssFeed(xml, maxItems = 5) {
  const items = []

  // Try RSS format first
  const rssItemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = rssItemRegex.exec(xml)) !== null && items.length < maxItems) {
    const itemContent = match[1]
    const title = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim()
    const description = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim()
    const link = itemContent.match(/<link>(.*?)<\/link>/i)?.[1]?.trim()
    const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i)?.[1]?.trim()

    if (title) {
      items.push({
        title: title.replace(/<[^>]*>/g, ''),
        description: description?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
        link,
        pubDate: pubDate ? new Date(pubDate).toISOString() : null
      })
    }
  }

  // Try Atom format if no RSS items found
  if (items.length === 0) {
    const atomEntryRegex = /<entry>([\s\S]*?)<\/entry>/gi
    while ((match = atomEntryRegex.exec(xml)) !== null && items.length < maxItems) {
      const entryContent = match[1]
      const title = entryContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
      const summary = entryContent.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.trim()
      const content = entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1]?.trim()
      const link = entryContent.match(/<link[^>]*href="([^"]*)"[^>]*\/>/i)?.[1]
      const updated = entryContent.match(/<updated>(.*?)<\/updated>/i)?.[1]?.trim()

      if (title) {
        items.push({
          title: title.replace(/<[^>]*>/g, ''),
          description: (summary || content)?.replace(/<[^>]*>/g, '').substring(0, 500) || '',
          link,
          pubDate: updated ? new Date(updated).toISOString() : null
        })
      }
    }
  }

  return items
}

// Fetch RSS feed for a single commentator
async function fetchCommentatorFeed(commentator, baseUrl) {
  if (!commentator.substackUrl) return null

  const feedPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml']
  let origin

  try {
    origin = new URL(commentator.substackUrl).origin
  } catch {
    return null
  }

  for (const path of feedPaths) {
    try {
      const feedUrl = `${origin}${path}`
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KeyIssues Bot)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) continue

      const text = await response.text()
      if (text.includes('<item>') || text.includes('<entry>')) {
        const articles = parseRssFeed(text)
        if (articles.length > 0) {
          return {
            name: commentator.name,
            score: commentator.score,
            category: categorizeByLean(commentator.score),
            articles
          }
        }
      }
    } catch {
      continue
    }
  }

  return null
}

/**
 * Aggregate content from all commentators with Substack feeds
 * @param {Array} commentators - Array of commentator objects from data.json
 * @param {string} baseUrl - Base URL for the RSS proxy (optional, for CORS issues)
 * @returns {Object} - Content grouped by left/center/right
 */
export async function aggregateContent(commentators, baseUrl = null) {
  const withSubstack = commentators.filter(c => c.substackUrl)

  // Fetch all feeds in parallel (with some batching to avoid rate limits)
  const batchSize = 5
  const results = []

  for (let i = 0; i < withSubstack.length; i += batchSize) {
    const batch = withSubstack.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(c => fetchCommentatorFeed(c, baseUrl))
    )
    results.push(...batchResults.filter(Boolean))
  }

  // Group by political lean
  const grouped = {
    left: [],
    center: [],
    right: []
  }

  for (const result of results) {
    if (grouped[result.category]) {
      grouped[result.category].push(result)
    }
  }

  // Filter to only recent content (last 7 days)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  for (const category of ['left', 'center', 'right']) {
    grouped[category] = grouped[category].map(commentator => ({
      ...commentator,
      articles: commentator.articles.filter(a => {
        if (!a.pubDate) return true // Include if no date
        return new Date(a.pubDate) > oneWeekAgo
      })
    })).filter(c => c.articles.length > 0)
  }

  return grouped
}

export { parseScore, categorizeByLean }
