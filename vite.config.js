import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev middleware to handle /api/rss locally
function rssProxyPlugin() {
  return {
    name: 'rss-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/rss')) return next()

        const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url')
        if (!urlParam) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing url parameter' }))
          return
        }

        const feedPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml']
        let origin
        try {
          origin = new URL(urlParam).origin
        } catch {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Invalid URL' }))
          return
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
            if (text.includes('<item>') || text.includes('<entry>')) {
              res.setHeader('Content-Type', 'application/xml')
              res.end(text)
              return
            }
          } catch {
            continue
          }
        }

        res.statusCode = 404
        res.end(JSON.stringify({ error: 'No RSS feed found' }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rssProxyPlugin()],
})
