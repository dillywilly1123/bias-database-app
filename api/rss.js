export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  // Helper to fetch and validate RSS
  async function tryFetchRss(feedUrl) {
    try {
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      })

      if (!response.ok) return null

      const text = await response.text()

      // Check if it's valid XML with items
      if (text.includes('<item>') || text.includes('<entry>')) {
        return text
      }
      return null
    } catch {
      return null
    }
  }

  // First, try the exact URL provided (for direct RSS feeds like YouTube)
  const directResult = await tryFetchRss(url)
  if (directResult) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    return res.status(200).send(directResult)
  }

  // Fallback: try common RSS feed paths (for sites like Substack)
  const feedPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml']

  for (const path of feedPaths) {
    const feedUrl = `${parsedUrl.origin}${path}`
    const result = await tryFetchRss(feedUrl)
    if (result) {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
      return res.status(200).send(result)
    }
  }

  return res.status(404).json({ error: 'No RSS feed found' })
}
