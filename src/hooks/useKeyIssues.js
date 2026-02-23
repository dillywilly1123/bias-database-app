import { useState, useEffect } from 'react'

const MAX_AGE_MS = 9 * 24 * 60 * 60 * 1000 // 9 days — discard data older than this

function isStale(data) {
  if (!data?.generatedAt) return true
  return Date.now() - new Date(data.generatedAt).getTime() > MAX_AGE_MS
}

export default function useKeyIssues() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchKeyIssues() {
      // Try API first — this has the freshest generated data from Redis
      try {
        const apiResponse = await fetch('/api/key-issues')
        if (apiResponse.ok) {
          const apiJson = await apiResponse.json()
          if (apiJson.topics?.length > 0 && !isStale(apiJson)) {
            setData(apiJson)
            setLoading(false)
            return
          }
        }
      } catch {
        // API failed, fall through to static file
      }

      // Fall back to static file only if API didn't return fresh data
      try {
        const staticResponse = await fetch('/key-issues.json')
        if (staticResponse.ok) {
          const staticJson = await staticResponse.json()
          if (staticJson.topics?.length > 0 && !isStale(staticJson)) {
            setData(staticJson)
          }
        }
      } catch {
        // Both sources failed
      }

      setLoading(false)
    }

    fetchKeyIssues()
  }, [])

  return { data, loading, error }
}
