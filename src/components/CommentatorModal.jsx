import { useEffect } from 'react'
import ScoreBadge, { getLeanLabel } from './ScoreBadge'
import Headshot from './Headshot'
import MetricsBadges from './MetricsBadges'

export default function CommentatorModal({ person, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!person) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer z-10"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start gap-5 mb-6 pr-8">
            <Headshot name={person.name} score={person.score} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {person.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getLeanLabel(person.score)}
              </p>
              <div className="mt-2">
                <ScoreBadge score={person.score} size="lg" />
              </div>
            </div>
          </div>

          {/* Metrics */}
          <MetricsBadges person={person} />

          <hr className="border-gray-200 dark:border-gray-700 my-6" />

          {/* Sections */}
          <section className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Strongest Beliefs
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {person.strongestBeliefs}
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Common Themes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {person.commonThemes}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Audience Profile
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {person.audienceProfile}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
