import { useState, useEffect, useCallback, useMemo } from 'react'

const CORS_PROXY = 'https://api.allorigins.win/raw?url='
const cache = new Map()

function getFeedUrl(substackUrl) {
  return substackUrl ? substackUrl.replace(/\/?$/, '/feed') : null
}

export default function useSubstackFeed(substackUrl) {
  const feedUrl = useMemo(() => getFeedUrl(substackUrl), [substackUrl])
  const cached = feedUrl ? cache.get(feedUrl) : undefined
  const [posts, setPosts] = useState(cached || null)

  const fetchFeed = useCallback(async (url, signal) => {
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, { signal })
    if (!res.ok) throw new Error('Failed to fetch feed')
    const xml = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items = doc.querySelectorAll('item')
    const result = Array.from(items)
      .slice(0, 2)
      .map((item) => ({
        title: item.querySelector('title')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        pubDate: item.querySelector('pubDate')?.textContent || '',
      }))
    cache.set(url, result)
    return result
  }, [])

  useEffect(() => {
    if (!feedUrl || cache.has(feedUrl)) return

    const controller = new AbortController()
    let active = true

    fetchFeed(feedUrl, controller.signal)
      .then((result) => {
        if (active) setPosts(result)
      })
      .catch(() => {
        if (active) setPosts([])
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [feedUrl, fetchFeed])

  if (cached) return { posts: cached, loading: false }

  // loading = we have a URL but posts haven't resolved yet
  const loading = !!feedUrl && posts === null
  return { posts, loading }
}
