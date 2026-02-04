export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  // Try common RSS feed paths
  const feedPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml']

  let origin
  try {
    origin = new URL(url).origin
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  for (const path of feedPaths) {
    try {
      const feedUrl = `${origin}${path}`
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      })

      if (!response.ok) continue

      const text = await response.text()

      // Check if it's valid XML with items
      if (text.includes('<item>') || text.includes('<entry>')) {
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
        return res.status(200).send(text)
      }
    } catch {
      continue
    }
  }

  return res.status(404).json({ error: 'No RSS feed found' })
}
