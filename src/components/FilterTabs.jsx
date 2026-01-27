const filters = [
  { key: 'all', label: 'All' },
  { key: 'left', label: 'Left' },
  { key: 'center', label: 'Center' },
  { key: 'right', label: 'Right' },
]

export default function FilterTabs({ active, onChange }) {
  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            active === f.key
              ? f.key === 'left'
                ? 'bg-blue-600 text-white'
                : f.key === 'right'
                ? 'bg-red-600 text-white'
                : f.key === 'center'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
