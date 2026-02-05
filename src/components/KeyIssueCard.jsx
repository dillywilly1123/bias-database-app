import { useState, useMemo } from 'react'

const PERSPECTIVES = [
  { key: 'left', label: 'Left', color: 'blue' },
  { key: 'center', label: 'Center', color: 'gray' },
  { key: 'right', label: 'Right', color: 'red' }
]

export default function KeyIssueCard({ topic, onVoiceClick, commentators, latestContent }) {
  const [activeTab, setActiveTab] = useState('center')
  const activePerspective = topic.perspectives[activeTab]

  // Get articles for key voices in the active perspective
  const keyOpinions = useMemo(() => {
    if (!activePerspective?.keyVoices || !commentators || !latestContent) return []

    return activePerspective.keyVoices
      .map((voiceName) => {
        const commentator = commentators.find(
          (c) => c.name.toLowerCase() === voiceName.toLowerCase()
        )
        if (!commentator) return null

        const content = latestContent[commentator.id]
        const article = content?.substackArticle
        if (!article) return null

        return {
          name: commentator.name,
          article
        }
      })
      .filter(Boolean)
  }, [activePerspective, commentators, latestContent])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col">
      {/* Topic Header */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        {topic.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {topic.description}
      </p>

      {/* Perspective Tabs */}
      <div className="flex gap-1 mb-4">
        {PERSPECTIVES.map(({ key, label, color }) => {
          const isActive = activeTab === key
          const baseClasses = 'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors cursor-pointer'

          let colorClasses
          if (isActive) {
            if (color === 'blue') {
              colorClasses = 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            } else if (color === 'gray') {
              colorClasses = 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            } else {
              colorClasses = 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
            }
          } else {
            colorClasses = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }

          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`${baseClasses} ${colorClasses}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    color === 'blue'
                      ? 'bg-blue-500'
                      : color === 'gray'
                      ? 'bg-gray-500'
                      : 'bg-red-500'
                  }`}
                />
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Perspective Content */}
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {activePerspective.summary}
        </p>
      </div>

      {/* Key Voices */}
      {activePerspective.keyVoices && activePerspective.keyVoices.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            Key Voices
          </p>
          <div className="flex flex-wrap gap-2">
            {activePerspective.keyVoices.map((voice) => (
              <button
                key={voice}
                onClick={() => onVoiceClick?.(voice)}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                {voice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Opinions */}
      {keyOpinions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            Key Opinions
          </p>
          <div className="space-y-2">
            {keyOpinions.map(({ name, article }) => (
              <a
                key={name}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  {name}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                  {article.title}
                </p>
                {article.pubDate && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(article.pubDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
