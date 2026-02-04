import { useState, useEffect } from 'react'

export default function useKeyIssues() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchKeyIssues() {
      // Try static file first for reliability
      // API endpoint is only used when Redis has generated content
      try {
        // First try static file (always available)
        const staticResponse = await fetch('/key-issues.json')
        if (staticResponse.ok) {
          const staticJson = await staticResponse.json()
          if (staticJson.topics && staticJson.topics.length > 0) {
            setData(staticJson)
            setLoading(false)

            // Then check API for fresher data in background
            try {
              const apiResponse = await fetch('/api/key-issues')
              if (apiResponse.ok) {
                const apiJson = await apiResponse.json()
                if (apiJson.topics && apiJson.topics.length > 0) {
                  setData(apiJson)
                }
              }
            } catch {
              // API failed, keep using static data
            }
            return
          }
        }
      } catch {
        // Static file failed, try API
      }

      // Fallback to API only
      try {
        const response = await fetch('/api/key-issues')
        if (response.ok) {
          const json = await response.json()
          if (json.topics && json.topics.length > 0) {
            setData(json)
          }
        }
      } catch {
        // Both failed
      }

      setLoading(false)
    }

    fetchKeyIssues()
  }, [])

  return { data, loading, error }
}
