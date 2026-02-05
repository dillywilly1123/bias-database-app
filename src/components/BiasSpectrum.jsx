import { useState, useMemo } from 'react'
import { getScorePosition, parseScore } from './ScoreBadge'

export default function BiasSpectrum({ data, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null)

  // Calculate stacking offsets for dots at the same position
  const stackedData = useMemo(() => {
    const positionGroups = {}

    // Group by position (rounded to avoid floating point issues)
    data.forEach((person) => {
      const position = Math.round(getScorePosition(person.score) * 10) / 10
      if (!positionGroups[position]) {
        positionGroups[position] = []
      }
      positionGroups[position].push(person)
    })

    // Assign stack index to each person
    const result = new Map()
    Object.values(positionGroups).forEach((group) => {
      group.forEach((person, index) => {
        result.set(person.id, { stackIndex: index, stackSize: group.length })
      })
    })

    return result
  }, [data])

  // Calculate container height based on max stack
  const maxStack = useMemo(() => {
    let max = 1
    stackedData.forEach(({ stackSize }) => {
      if (stackSize > max) max = stackSize
    })
    return max
  }, [stackedData])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
        Bias Spectrum
      </h2>

      {/* Labels */}
      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
        <span>Far Left</span>
        <span>Center-Left</span>
        <span>Center</span>
        <span>Center-Right</span>
        <span>Far Right</span>
      </div>

      {/* Spectrum bar */}
      <div className="relative">
        {/* Gradient bar */}
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-gradient-to-r from-blue-800 to-blue-300" />
          <div className="w-1 bg-gray-300 dark:bg-gray-600" />
          <div className="flex-1 bg-gradient-to-r from-red-300 to-red-800" />
        </div>

        {/* Center marker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-0.5 bg-gray-400 dark:bg-gray-500" />

        {/* Dots */}
        <div className="relative mt-1" style={{ height: `${Math.max(40, maxStack * 16 + 8)}px` }}>
          {data.map((person) => {
            const position = getScorePosition(person.score)
            const pct = (position / 100) * 100
            const { lean } = parseScore(person.score)
            const isHovered = hoveredId === person.id
            const { stackIndex } = stackedData.get(person.id) || { stackIndex: 0 }

            let dotColor = 'bg-gray-500'
            if (lean === 'D') dotColor = 'bg-blue-500'
            if (lean === 'R') dotColor = 'bg-red-500'

            // Stack dots vertically - first dot at bottom, additional dots above
            const topOffset = 4 + stackIndex * 16

            return (
              <button
                key={person.id}
                className={`absolute -translate-x-1/2 rounded-full transition-all cursor-pointer border-2 border-white dark:border-gray-800 ${dotColor} ${
                  isHovered ? 'w-5 h-5 z-20 shadow-lg' : 'w-3.5 h-3.5 z-10 hover:w-5 hover:h-5 hover:z-20'
                }`}
                style={{ left: `${pct}%`, top: `${topOffset}px` }}
                onMouseEnter={() => setHoveredId(person.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(person)}
                title={`${person.name} (${person.score})`}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                    <span className="font-semibold">{person.name}</span>
                    <span className="ml-1.5 opacity-75">({person.score})</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
