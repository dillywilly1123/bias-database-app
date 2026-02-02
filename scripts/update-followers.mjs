#!/usr/bin/env node

/**
 * Daily follower count updater.
 *
 * Reads public/data.json, fetches current follower counts from available APIs,
 * and writes the updated data back. Designed to run via GitHub Actions cron.
 *
 * Required environment variables:
 *   YOUTUBE_API_KEY       – YouTube Data API v3 key
 *   RAPIDAPI_KEY          – RapidAPI key (for X/Instagram/TikTok via social-media-data-api or similar)
 *
 * The script is conservative: if an API call fails for a given person,
 * their existing counts are preserved.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = join(__dirname, '..', 'public', 'data.json')

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── YouTube ────────────────────────────────────────────────────────────────

async function getYoutubeSubscribers(youtubeUrl) {
  if (!youtubeUrl || !YOUTUBE_API_KEY) return null

  const channelMatch = youtubeUrl.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)
  const handleMatch = youtubeUrl.match(/\/@([a-zA-Z0-9_.-]+)/)

  let channelId = channelMatch?.[1]

  if (!channelId && handleMatch) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${YOUTUBE_API_KEY}`
    )
    if (!res.ok) return null
    const data = await res.json()
    channelId = data.items?.[0]?.id
  }

  if (!channelId) return null

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
  )
  if (!res.ok) return null
  const data = await res.json()
  const count = data.items?.[0]?.statistics?.subscriberCount
  return count ? parseInt(count, 10) : null
}

// ─── Substack ───────────────────────────────────────────────────────────────

async function getSubstackSubscribers(substackUrl) {
  // Substack doesn't expose subscriber counts publicly via RSS.
  // We keep the manually-entered value. This is a placeholder for
  // future integration if a data source becomes available.
  return null
}

// ─── X / Instagram / TikTok via RapidAPI ────────────────────────────────────
// These use a generic social stats API on RapidAPI.
// You'll need to subscribe to one (many free tiers exist) and adjust the
// endpoint/host below. Example: "social-media-data-api" or "social-counts".

const SOCIAL_API_HOST = 'social-media-data-tt.p.rapidapi.com' // adjust to your chosen API

async function fetchSocialCount(platform, username) {
  if (!username || !RAPIDAPI_KEY) return null

  try {
    // This is a generic pattern — adjust URL/params to match your chosen RapidAPI endpoint
    const res = await fetch(
      `https://${SOCIAL_API_HOST}/live/${platform}/user/${encodeURIComponent(username)}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': SOCIAL_API_HOST,
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.followers ?? data.followerCount ?? data.subscriber_count ?? null
  } catch {
    return null
  }
}

function extractUsername(url) {
  if (!url) return null
  // Handles https://x.com/user, https://instagram.com/user, https://tiktok.com/@user
  const match = url.match(/\.com\/@?([a-zA-Z0-9_.]+)/)
  return match?.[1] || null
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const raw = await readFile(DATA_PATH, 'utf-8')
  const data = JSON.parse(raw)

  console.log(`Updating follower counts for ${data.length} entries...`)

  for (const person of data) {
    console.log(`  ${person.name}...`)

    // YouTube
    const ytCount = await getYoutubeSubscribers(person.youtubeUrl)
    if (ytCount !== null) person.youtubeSubscribers = ytCount

    // X
    const xUser = extractUsername(person.xUrl)
    const xCount = await fetchSocialCount('twitter', xUser)
    if (xCount !== null) person.xFollowers = xCount

    // Instagram
    const igUser = extractUsername(person.instagramUrl)
    const igCount = await fetchSocialCount('instagram', igUser)
    if (igCount !== null) person.instagramFollowers = igCount

    // TikTok
    const ttUser = extractUsername(person.tiktokUrl)
    const ttCount = await fetchSocialCount('tiktok', ttUser)
    if (ttCount !== null) person.tiktokFollowers = ttCount

    // Be nice to rate limits
    await sleep(200)
  }

  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log('Done. data.json updated.')
}

main().catch((err) => {
  console.error('Update failed:', err)
  process.exit(1)
})
