import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search apartments or keywords…' }) {
  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">
        <Search size={16} />
      </span>
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search within these results"
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}