import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '../public/data.json')

async function getChannelIdFromPage(youtubeUrl) {
  try {
    const res = await fetch(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (res.status !== 200) {
      console.error(`  HTTP ${res.status}`)
      return null
    }

    const html = await res.text()
    const match = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)
    return match ? match[1] : null
  } catch (err) {
    console.error(`  Error: ${err.message}`)
    return null
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
  const toProcess = data.filter(p => p.youtubeUrl && !p.youtubeChannelId)

  console.log(`Found ${toProcess.length} remaining\n`)

  let successCount = 0

  for (const person of toProcess) {
    process.stdout.write(`${person.name}: `)

    // Longer delay between requests
    await new Promise(r => setTimeout(r, 3000))

    const channelId = await getChannelIdFromPage(person.youtubeUrl)

    if (channelId) {
      person.youtubeChannelId = channelId
      console.log(channelId)
      successCount++
    } else {
      console.log('FAILED - ' + person.youtubeUrl)
    }
  }

  if (successCount > 0) {
    console.log('\nWriting updated data.json...')
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
    console.log('Done!')
  }
}

main().catch(console.error)
