import XLSX from 'xlsx'
import { writeFileSync } from 'fs'

const wb = XLSX.readFile('IndependentVoicesData.xlsx')
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws)

const data = rows.map((row, i) => {
  const entry = {
    id: i + 1,
    name: row['Individual'],
    score: row['Score'],
    strongestBeliefs: row['Strongest Beliefs'],
    commonThemes: row['Common Themes'],
    audienceProfile: row['Audience Profile'],
  }

  const urlFields = ['xUrl', 'substackUrl', 'youtubeUrl', 'instagramUrl', 'tiktokUrl']
  for (const field of urlFields) {
    const val = row[field]
    if (val && val !== 'null' && val.trim()) {
      entry[field] = val.trim()
    }
  }

  return entry
})

writeFileSync('public/data.json', JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${data.length} records to public/data.json`)
