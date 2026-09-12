export default function SearchBar({ value, onChange, placeholder = 'Search apartments or keywords…' }) {
  return (
    <div className="search-bar">
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
          ×
        </button>
      )}
    </div>
  )
}