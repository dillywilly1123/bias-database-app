function formatCount(num) {
  if (!num && num !== 0) return null
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toString()
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
      <path d="M9.545 15.568V8.432L15.818 12z" fill="white" />
    </svg>
  )
}

function SubstackIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24l9.54-5.18L20.539 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  )
}

export default function MetricsBadges({ person, compact = false }) {
  const metrics = [
    { key: 'xFollowers', icon: XIcon, label: 'X' },
    { key: 'youtubeSubscribers', icon: YouTubeIcon, label: 'YouTube' },
    { key: 'substackSubscribers', icon: SubstackIcon, label: 'Substack' },
  ]

  const available = metrics.filter((m) => person[m.key])
  if (available.length === 0) return null

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-3'} flex-wrap`}>
      {available.map((m) => (
        <div
          key={m.key}
          className={`flex items-center gap-1 ${
            compact
              ? 'text-xs text-gray-400 dark:text-gray-500'
              : 'text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg'
          }`}
          title={`${m.label}: ${person[m.key].toLocaleString()}`}
        >
          <m.icon />
          <span className="font-medium">{formatCount(person[m.key])}</span>
        </div>
      ))}
    </div>
  )
}
