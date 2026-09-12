import { BHK_OPTIONS, FURNISHING_OPTIONS, LOCALITIES } from '../listings/filterOptions'

export default function ListingFilters({ filters, priceError, onChange, onApplyPrice, onReset }) {
  const activeCount = [
    filters.locality,
    filters.bhk,
    filters.furnishing,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length

  return (
    <aside className="card filters">
      <div className="filters-head">
        <h2>Filters</h2>
        {activeCount > 0 && (
          <button type="button" className="ghost small" onClick={onReset}>
            Clear ({activeCount})
          </button>
        )}
      </div>

      <div className="filter-group">
        <label htmlFor="filter-locality">Locality</label>
        <select
          id="filter-locality"
          value={filters.locality}
          onChange={(event) => onChange({ ...filters, locality: event.target.value })}
        >
          <option value="">All localities</option>
          {LOCALITIES.map((locality) => (
            <option key={locality} value={locality}>
              {locality.replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-bhk">Bedrooms (BHK)</label>
        <select
          id="filter-bhk"
          value={filters.bhk}
          onChange={(event) => onChange({ ...filters, bhk: event.target.value })}
        >
          <option value="">Any</option>
          {BHK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-furnishing">Furnishing</label>
        <select
          id="filter-furnishing"
          value={filters.furnishing}
          onChange={(event) => onChange({ ...filters, furnishing: event.target.value })}
        >
          <option value="">Any</option>
          {FURNISHING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Price range (₹ Lakhs)</label>
        <div className="price-row">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="Min"
            aria-label="Minimum price in lakhs"
            value={filters.minPrice}
            onChange={(event) => onChange({ ...filters, minPrice: event.target.value })}
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="Max"
            aria-label="Maximum price in lakhs"
            value={filters.maxPrice}
            onChange={(event) => onChange({ ...filters, maxPrice: event.target.value })}
          />
        </div>
        <button type="button" className="ghost small" onClick={onApplyPrice}>
          Apply price
        </button>
        {priceError && <p className="bad filter-error">{priceError}</p>}
      </div>
    </aside>
  )
}