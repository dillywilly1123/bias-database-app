import ScoreBadge, { getLeanLabel } from './ScoreBadge'
import Headshot from './Headshot'
import MetricsBadges from './MetricsBadges'

export default function CommentatorCard({ person, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4 mb-3">
        <Headshot name={person.name} score={person.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <ScoreBadge score={person.score} />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
              {getLeanLabel(person.score)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {person.name}
          </h3>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
        {person.strongestBeliefs}
      </p>
      <MetricsBadges person={person} compact />
      <div className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
        View Profile
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
