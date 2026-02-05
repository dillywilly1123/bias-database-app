import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../public/data.json')

// Extract channel ID from YouTube page HTML (no API needed)
async function getChannelIdFromPage(youtubeUrl) {
  try {
    const res = await fetch(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      console.error(`  HTTP ${res.status}`)
      return null
    }

    const html = await res.text()

    // Try multiple patterns to extract channel ID
    const patterns = [
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
      /channel_id=([^"&]+)/,
      /<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/,
      /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match && match[1] && match[1].startsWith('UC')) {
        return match[1]
      }
    }

    console.error('  No channel ID found in HTML')
    return null
  } catch (err) {
    console.error(`  Fetch error: ${err.message}`)
    return null
  }
}

async function main() {
  console.log('Reading data.json...')
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))

  const toProcess = data.filter(p => p.youtubeUrl && !p.youtubeChannelId)
  console.log(`Found ${toProcess.length} commentators needing channel IDs\n`)

  let successCount = 0
  let failCount = 0

  for (const person of toProcess) {
    process.stdout.write(`${person.name}: `)

    const channelId = await getChannelIdFromPage(person.youtubeUrl)

    if (channelId) {
      person.youtubeChannelId = channelId
      console.log(channelId)
      successCount++
    } else {
      console.log('FAILED')
      failCount++
    }

    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nResults: ${successCount} succeeded, ${failCount} failed`)

  if (successCount > 0) {
    console.log('\nWriting updated data.json...')
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
    console.log('Done!')
  }
}

main().catch(console.error)
