import { useState } from 'react'
import { parseScore } from './ScoreBadge'

export function getImageSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function getInitials(name) {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getFallbackColor(score) {
  const { lean } = parseScore(score)
  if (lean === 'D') return 'bg-blue-600'
  if (lean === 'R') return 'bg-red-600'
  return 'bg-gray-500'
}

export default function Headshot({ name, score, size = 'md' }) {
  const [failed, setFailed] = useState(false)
  const slug = getImageSlug(name)
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-sm'

  if (failed) {
    return (
      <div className={`${sizeClass} rounded-full ${getFallbackColor(score)} text-white flex items-center justify-center font-bold shrink-0`}>
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={`/headshots/${slug}.jpg`}
      alt={name}
      onError={() => setFailed(true)}
      className={`${sizeClass} rounded-full object-cover shrink-0`}
    />
  )
}
