import { useState, useEffect } from 'react'

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

function decodeHtmlEntities(str) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = str
  return textarea.value
}

function extractYoutubeInfo(url) {
  if (!url) return null
  const handleMatch = url.match(/youtube\.com\/@([^/?]+)/)
  if (handleMatch) return { type: 'handle', value: handleMatch[1] }
  const channelMatch = url.match(/youtube\.com\/channel\/([^/?]+)/)
  if (channelMatch) return { type: 'channelId', value: channelMatch[1] }
  return null
}

function extractFeedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    return `${u.origin}/feed`
  } catch {
    return null
  }
}

async function fetchYoutubeVideo(youtubeUrl) {
  if (!YOUTUBE_API_KEY) return null
  const info = extractYoutubeInfo(youtubeUrl)
  if (!info) return null

  let channelId
  if (info.type === 'channelId') {
    channelId = info.value
  } else {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?forHandle=${info.value}&part=id&key=${YOUTUBE_API_KEY}`
    )
    const channelData = await channelRes.json()
    channelId = channelData.items?.[0]?.id
  }
  if (!channelId) return null

  // Get latest video
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&maxResults=1&type=video&part=snippet&key=${YOUTUBE_API_KEY}`
  )
  const searchData = await searchRes.json()
  const item = searchData.items?.[0]
  if (!item) return null

  return {
    title: decodeHtmlEntities(item.snippet.title),
    videoId: item.id.videoId,
    thumbnail: item.snippet.thumbnails.medium.url,
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }
}

async function fetchSubstackArticle(substackUrl) {
  const feedUrl = extractFeedUrl(substackUrl)
  if (!feedUrl) return null
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`)
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
}

export default function useLatestContent(data) {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!data || data.length === 0) return

    const relevantPeople = data.filter((p) => p.youtubeUrl || p.substackUrl)
    if (relevantPeople.length === 0) return

    setLoading(true)

    const fetches = relevantPeople.map(async (person) => {
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
      const map = {}
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          map[r.value.id] = r.value
        }
      }
      setContent(map)
      setLoading(false)
    })
  }, [data])

  return { content, loading }
}
