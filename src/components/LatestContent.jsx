import useSubstackFeed from '../hooks/useSubstackFeed'
import useYoutubeLatest from '../hooks/useYoutubeLatest'

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LoadingDots() {
  return (
    <div className="flex gap-1 py-3">
      <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
      <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse [animation-delay:150ms]" />
      <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse [animation-delay:300ms]" />
    </div>
  )
}

function SubstackPosts({ posts, loading }) {
  if (loading) return <LoadingDots />
  if (!posts || posts.length === 0) return null

  return (
    <section className="mt-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
        Latest on Substack
      </h3>
      <div className="space-y-2">
        {posts.map((post, i) => (
          <a
            key={i}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
              {post.title}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formatDate(post.pubDate)}
            </p>
          </a>
        ))}
      </div>
    </section>
  )
}

function YouTubeVideos({ videos, loading }) {
  if (loading) return <LoadingDots />
  if (!videos || videos.length === 0) return null

  return (
    <section className="mt-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
        Latest on YouTube
      </h3>
      <div className="space-y-2">
        {videos.map((video, i) => (
          <a
            key={i}
            href={video.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt=""
                className="w-28 h-16 object-cover rounded flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                {video.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDate(video.pubDate)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function LatestContent({ person }) {
  const { posts, loading: substackLoading } = useSubstackFeed(person.substackUrl || null)
  const { videos, loading: youtubeLoading } = useYoutubeLatest(
    // Only fetch YouTube videos if the person has no Substack
    !person.substackUrl && person.youtubeUrl ? person.youtubeUrl : null,
    YOUTUBE_API_KEY
  )

  // Show Substack posts if they have a Substack, otherwise show YouTube videos
  if (person.substackUrl) {
    return <SubstackPosts posts={posts} loading={substackLoading} />
  }

  if (person.youtubeUrl) {
    return <YouTubeVideos videos={videos} loading={youtubeLoading} />
  }

  return null
}
