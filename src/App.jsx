import { useState, useEffect, useMemo } from 'react'
import BiasSpectrum from './components/BiasSpectrum'
import CommentatorCard from './components/CommentatorCard'
import CommentatorModal from './components/CommentatorModal'
import SearchBar from './components/SearchBar'
import FilterTabs from './components/FilterTabs'
import { parseScore } from './components/ScoreBadge'
import useLatestContent from './hooks/useLatestContent'
import { Analytics } from '@vercel/analytics/react'

function App() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then(setData)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const { content: latestContent } = useLatestContent(data)

  const filtered = useMemo(() => {
    return data.filter((person) => {
      const matchesSearch = person.name.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (filter === 'all') return true
      const { value, lean } = parseScore(person.score)
      const isCenter = lean === 'C' || value < 10
      if (filter === 'left') return lean === 'D' && !isCenter
      if (filter === 'right') return lean === 'R' && !isCenter
      if (filter === 'center') return isCenter
      return true
    })
  }, [data, search, filter])

  return (
    <>
    <Analytics />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Independent Voices
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Political Commentator Bias Database
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Bias Spectrum */}
        <BiasSpectrum data={data} onSelect={setSelected} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full sm:w-auto">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <FilterTabs active={filter} onChange={setFilter} />
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filtered.length} of {data.length} commentators
        </p>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((person) => (
            <CommentatorCard
              key={person.id}
              person={person}
              latestContent={latestContent[person.id]}
              onClick={() => setSelected(person)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500 text-lg">
              No commentators found matching your criteria.
            </p>
          </div>
        )}
      </main>

      {/* Modal */}
      {selected && (
        <CommentatorModal
          person={selected}
          latestContent={latestContent[selected.id]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
    </>
  )
}

export default App
