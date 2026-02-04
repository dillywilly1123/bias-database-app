import { useState, useEffect } from 'react'

export default function useKeyIssues() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchKeyIssues() {
      try {
        // Try the API endpoint first (production with Vercel KV)
        let response = await fetch('/api/key-issues')
        let json = await response.json()

        // If API returns data with topics, use it
        if (json.topics && json.topics.length > 0) {
          setData(json)
          setLoading(false)
          return
        }

        // Fall back to static file (local development or if KV is empty)
        response = await fetch('/key-issues.json')
        if (!response.ok) throw new Error('Failed to fetch key issues')
        json = await response.json()
        setData(json)
        setLoading(false)
      } catch (err) {
        // Final fallback: try static file directly
        try {
          const response = await fetch('/key-issues.json')
          if (!response.ok) throw new Error('Failed to fetch key issues')
          const json = await response.json()
          setData(json)
          setLoading(false)
        } catch (fallbackErr) {
          setError(fallbackErr.message)
          setLoading(false)
        }
      }
    }

    fetchKeyIssues()
  }, [])

  return { data, loading, error }
}
