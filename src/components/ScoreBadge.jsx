export function parseScore(score) {
  if (!score || score === '0') return { value: 0, lean: 'C' }
  const match = score.match(/^(\d+)(D|R)$/i)
  if (!match) return { value: 0, lean: 'C' }
  return { value: parseInt(match[1], 10), lean: match[2].toUpperCase() }
}

export function getScorePosition(score) {
  const { value, lean } = parseScore(score)
  if (lean === 'D') return 50 - value
  if (lean === 'R') return 50 + value
  return 50
}

export function getScoreColor(score, mode = 'bg') {
  const { value, lean } = parseScore(score)

  if (lean === 'C') {
    return mode === 'bg'
      ? 'bg-gray-500 text-white'
      : 'text-gray-500'
  }

  if (lean === 'D') {
    if (value >= 40) return mode === 'bg' ? 'bg-blue-900 text-white' : 'text-blue-900'
    if (value >= 30) return mode === 'bg' ? 'bg-blue-700 text-white' : 'text-blue-700'
    if (value >= 20) return mode === 'bg' ? 'bg-blue-600 text-white' : 'text-blue-600'
    if (value >= 10) return mode === 'bg' ? 'bg-blue-400 text-white' : 'text-blue-400'
    return mode === 'bg' ? 'bg-blue-200 text-blue-900' : 'text-blue-400'
  }

  if (lean === 'R') {
    if (value >= 40) return mode === 'bg' ? 'bg-red-900 text-white' : 'text-red-900'
    if (value >= 30) return mode === 'bg' ? 'bg-red-700 text-white' : 'text-red-700'
    if (value >= 20) return mode === 'bg' ? 'bg-red-600 text-white' : 'text-red-600'
    if (value >= 10) return mode === 'bg' ? 'bg-red-400 text-white' : 'text-red-400'
    return mode === 'bg' ? 'bg-red-200 text-red-900' : 'text-red-400'
  }
}

export function getLeanLabel(score) {
  const { value, lean } = parseScore(score)
  if (lean === 'C' || value < 10) return 'Center'
  if (lean === 'D') {
    if (value >= 40) return 'Far Left'
    if (value >= 25) return 'Left'
    return 'Center-Left'
  }
  if (lean === 'R') {
    if (value >= 40) return 'Far Right'
    if (value >= 25) return 'Right'
    return 'Center-Right'
  }
}

export default function ScoreBadge({ score, size = 'md' }) {
  const colorClass = getScoreColor(score)
  const sizeClass = size === 'lg' ? 'px-4 py-2 text-lg font-bold' : 'px-2.5 py-1 text-sm font-semibold'

  return (
    <span className={`inline-flex items-center rounded-full ${colorClass} ${sizeClass}`}>
      {score === '0' ? 'Center' : score}
    </span>
  )
}
