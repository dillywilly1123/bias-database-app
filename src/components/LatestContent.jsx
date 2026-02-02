export default function LatestContent({ data, compact = false }) {
  if (!data) return null

  const { youtubeVideo, substackArticle } = data
  if (!youtubeVideo && !substackArticle) return null

  return (
    <div className={compact ? 'mt-3 space-y-2' : 'space-y-4'}>
      {youtubeVideo && (
        <a
          href={youtubeVideo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 items-start group/yt"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={youtubeVideo.thumbnail}
            alt=""
            className={`rounded-lg object-cover flex-shrink-0 ${compact ? 'w-24 h-14' : 'w-36 h-20'}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
              Latest Video
            </p>
            <p className={`font-medium text-gray-800 dark:text-gray-200 group-hover/yt:text-red-600 dark:group-hover/yt:text-red-400 transition-colors line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
              {youtubeVideo.title}
            </p>
            {!compact && youtubeVideo.publishedAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(youtubeVideo.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </a>
      )}

      {substackArticle && (
        <a
          href={substackArticle.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group/ss"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
            Latest Article
          </p>
          <p className={`font-medium text-gray-800 dark:text-gray-200 group-hover/ss:text-orange-600 dark:group-hover/ss:text-orange-400 transition-colors line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {substackArticle.title}
          </p>
          {!compact && substackArticle.pubDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {new Date(substackArticle.pubDate).toLocaleDateString()}
            </p>
          )}
        </a>
      )}
    </div>
  )
}
