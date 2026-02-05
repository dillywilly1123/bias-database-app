import { useState, useEffect } from 'react'

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const CACHE_KEY = 'latestContent'
const CHANNEL_ID_CACHE_KEY = 'youtubeChannelIds'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const FAILURE_CACHE_TTL = 60 * 60 * 1000 // 1 hour for failed requests

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return {}
    return JSON.parse(cached)
  } catch {
    return {}
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage might be full or disabled
  }
}

function getCachedItem(cache, id) {
  const item = cache[id]
  if (!item) return null

  // Use shorter TTL for failed/empty results
  const hasContent = item.data?.youtubeVideo || item.data?.substackArticle
  const ttl = hasContent ? CACHE_TTL : FAILURE_CACHE_TTL

  if (Date.now() - item.timestamp > ttl) return null
  return item.data
}

function setCachedItem(cache, id, data) {
  cache[id] = { data, timestamp: Date.now() }
}

function decodeHtmlEntities(str) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = str
  return textarea.value
}

// Separate permanent cache for channel IDs (never expires)
function getChannelIdCache() {
  try {
    const cached = localStorage.getItem(CHANNEL_ID_CACHE_KEY)
    if (!cached) return {}
    return JSON.parse(cached)
  } catch {
    return {}
  }
}

function setChannelIdCache(data) {
  try {
    localStorage.setItem(CHANNEL_ID_CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage might be full or disabled
  }
}

function extractYoutubeInfo(url) {
  if (!url) return null
  const handleMatch = url.match(/youtube\.com\/@([^/?]+)/)
  if (handleMatch) return { type: 'handle', value: handleMatch[1] }
  const channelMatch = url.match(/youtube\.com\/channel\/([^/?]+)/)
  if (channelMatch) return { type: 'channelId', value: channelMatch[1] }
  // Custom URL format: youtube.com/username (no @ or /channel/)
  const customMatch = url.match(/youtube\.com\/(?!@|channel\/|c\/|user\/|watch|playlist|feed|shorts)([^/?]+)/)
  if (customMatch) return { type: 'customUrl', value: customMatch[1] }
  return null
}


// Resolve YouTube handle/URL to channel ID (uses API, cached permanently)
async function resolveChannelId(youtubeUrl) {
  const info = extractYoutubeInfo(youtubeUrl)
  if (!info) {
    console.error('Could not extract YouTube info from:', youtubeUrl)
    return null
  }

  // Check permanent cache first
  const channelIdCache = getChannelIdCache()
  if (channelIdCache[youtubeUrl]) {
    return channelIdCache[youtubeUrl]
  }

  // If it's already a channel ID, cache and return it
  if (info.type === 'channelId') {
    channelIdCache[youtubeUrl] = info.value
    setChannelIdCache(channelIdCache)
    return info.value
  }

  // Need API to resolve handle/custom URL to channel ID
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing - cannot resolve channel ID')
    return null
  }

  let channelId = null
  try {
    if (info.type === 'handle') {
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?forHandle=${info.value}&part=id&key=${YOUTUBE_API_KEY}`
      )
      const channelData = await channelRes.json()
      if (channelData.error) {
        console.error('YouTube API error (handle lookup):', channelData.error)
        return null
      }
      channelId = channelData.items?.[0]?.id
    } else if (info.type === 'customUrl') {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(info.value)}&type=channel&part=snippet&maxResults=1&key=${YOUTUBE_API_KEY}`
      )
      const searchData = await searchRes.json()
      if (searchData.error) {
        console.error('YouTube API error (custom URL search):', searchData.error)
        return null
      }
      channelId = searchData.items?.[0]?.id?.channelId
    }

    if (channelId) {
      // Cache permanently
      channelIdCache[youtubeUrl] = channelId
      setChannelIdCache(channelIdCache)
    }

    return channelId
  } catch (err) {
    console.error('YouTube channel ID lookup error:', err)
    return null
  }
}

// Fetch latest video using RSS feed (no API quota cost)
async function fetchYoutubeVideoViaRss(channelId) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const res = await fetch(`/api/rss?url=${encodeURIComponent(rssUrl)}`)
    if (!res.ok) {
      console.error('YouTube RSS fetch failed:', res.status)
      return null
    }
    const text = await res.text()

    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const entry = xml.querySelector('entry')
    if (!entry) {
      console.error('No entries in YouTube RSS feed')
      return null
    }

    const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent
    const title = entry.querySelector('title')?.textContent
    const published = entry.querySelector('published')?.textContent

    if (!videoId) {
      console.error('Could not extract video ID from RSS')
      return null
    }

    return {
      title: title || 'Untitled',
      videoId,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt: published,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  } catch (err) {
    console.error('YouTube RSS fetch error:', err)
    return null
  }
}

async function fetchYoutubeVideo(youtubeUrl) {
  // Step 1: Get channel ID (from cache or API)
  const channelId = await resolveChannelId(youtubeUrl)
  if (!channelId) {
    return null
  }

  // Step 2: Fetch latest video via RSS (no quota cost)
  return fetchYoutubeVideoViaRss(channelId)
}

async function fetchSubstackArticle(substackUrl) {
  if (!substackUrl) return null

  try {
    const res = await fetch(`/api/rss?url=${encodeURIComponent(substackUrl)}`)
    if (!res.ok) return null
    const text = await res.text()

    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const item = xml.querySelector('item')
    if (!item) return null

    return {
      title: item.querySelector('title')?.textContent,
      url: item.querySelector('link')?.textContent,
      pubDate: item.querySelector('pubDate')?.textContent,
    }
  } catch {
    return null
  }
}

export default function useLatestContent(data) {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!data || data.length === 0) return

    const relevantPeople = data.filter((p) => p.youtubeUrl || p.substackUrl)
    if (relevantPeople.length === 0) return

    const cache = getCache()
    const initialContent = {}
    const peopleToFetch = []

    // Check cache first
    for (const person of relevantPeople) {
      const cached = getCachedItem(cache, person.id)
      if (cached) {
        initialContent[person.id] = cached
      } else {
        peopleToFetch.push(person)
      }
    }

    // Set cached content immediately
    if (Object.keys(initialContent).length > 0) {
      setContent(initialContent)
    }

    // If everything was cached, we're done
    if (peopleToFetch.length === 0) {
      return
    }

    setLoading(true)

    const fetches = peopleToFetch.map(async (person) => {
      const [ytResult, ssResult] = await Promise.allSettled([
        person.youtubeUrl ? fetchYoutubeVideo(person.youtubeUrl) : Promise.resolve(null),
        person.substackUrl ? fetchSubstackArticle(person.substackUrl) : Promise.resolve(null),
      ])

      return {
        id: person.id,
        youtubeVideo: ytResult.status === 'fulfilled' ? ytResult.value : null,
        substackArticle: ssResult.status === 'fulfilled' ? ssResult.value : null,
      }
    })

    Promise.allSettled(fetches).then((results) => {
      const newContent = { ...initialContent }
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          newContent[r.value.id] = r.value
          // Cache all results (failures use shorter TTL via getCachedItem)
          setCachedItem(cache, r.value.id, r.value)
        }
      }
      setCache(cache)
      setContent(newContent)
      setLoading(false)
    })
  }, [data])

  return { content, loading }
}
