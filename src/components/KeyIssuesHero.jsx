import useKeyIssues from '../hooks/useKeyIssues'
import KeyIssueCard from './KeyIssueCard'

export default function KeyIssuesHero({ onCommentatorSelect, commentators }) {
  const { data, loading, error } = useKeyIssues()

  const handleVoiceClick = (voiceName) => {
    if (!commentators || !onCommentatorSelect) return
    const match = commentators.find(
      (c) => c.name.toLowerCase() === voiceName.toLowerCase()
    )
    if (match) {
      onCommentatorSelect(match)
    }
  }

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Key Issues This Week
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Loading perspectives...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
              <div className="flex gap-1 mb-4">
                <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || !data?.topics?.length) {
    return null
  }

  const formattedDate = data.generatedAt
    ? new Date(data.generatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Key Issues This Week
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            AI-generated summary of commentator perspectives
          </p>
        </div>
        {formattedDate && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Updated {formattedDate}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.topics.map((topic) => (
          <KeyIssueCard
            key={topic.id}
            topic={topic}
            onVoiceClick={handleVoiceClick}
          />
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
        Summaries are AI-generated and may not perfectly represent each commentator's views
      </p>
    </section>
  )
}
