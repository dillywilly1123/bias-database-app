import { useState, useEffect, useCallback } from 'react'

const cache = new Map()

export default function useYoutubeLatest(youtubeUrl, apiKey) {
  const cacheKey = youtubeUrl || ''
  const cached = cacheKey ? cache.get(cacheKey) : undefined
  const [videos, setVideos] = useState(cached || null)

  const fetchVideos = useCallback(async (url, key, signal) => {
    const channelMatch = url.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)
    const handleMatch = url.match(/\/@([a-zA-Z0-9_.-]+)/)

    let channelId = channelMatch?.[1]

    if (!channelId && handleMatch) {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${key}`,
        { signal }
      )
      if (!res.ok) throw new Error('Failed to resolve handle')
      const data = await res.json()
      channelId = data.items?.[0]?.id
    }

    if (!channelId) return []

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=2&type=video&key=${key}`,
      { signal }
    )
    if (!res.ok) throw new Error('Failed to fetch videos')
    const data = await res.json()

    const result = (data.items || []).map((item) => ({
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.medium?.url || '',
      pubDate: item.snippet.publishedAt,
    }))

    cache.set(url, result)
    return result
  }, [])

  useEffect(() => {
    if (!youtubeUrl || !apiKey || cache.has(youtubeUrl)) return

    const controller = new AbortController()
    let active = true

    fetchVideos(youtubeUrl, apiKey, controller.signal)
      .then((result) => {
        if (active) setVideos(result)
      })
      .catch(() => {
        if (active) setVideos([])
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [youtubeUrl, apiKey, fetchVideos])

  if (cached) return { videos: cached, loading: false }

  const loading = !!youtubeUrl && !!apiKey && videos === null
  return { videos, loading }
}
