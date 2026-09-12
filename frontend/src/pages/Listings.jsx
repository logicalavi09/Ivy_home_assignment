import { useEffect, useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import client from '../api/client'
import EmptyState from '../components/EmptyState'
import FilterPanel from '../components/FilterPanel'
import ListingCard from '../components/ListingCard'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import SkeletonGrid from '../components/SkeletonGrid'
import { applySearch } from '../listings/localSearch'
import { EMPTY_FILTERS, filtersToParams } from '../listings/filterOptions'
import { useSaved } from '../saved/SavedContext'

const PAGE_SIZE = 50
const QUICK_FILTER_FIELDS = new Set(['locality', 'bhk', 'furnishing'])

export default function Listings() {
  const { isSaved, toggleSave } = useSaved()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [priceError, setPriceError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const params = { ...filtersToParams(applied, PAGE_SIZE), offset: page * PAGE_SIZE }

    client
      .get('/v1/listings', { params })
      .then(({ data }) => {
        if (cancelled) return
        setRows(data.results || [])
        setTotal(data.total ?? 0)
        setHasMore(Boolean(data.has_more))
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setRows([])
        setError('We couldn\u2019t load listings right now. Please try again in a moment.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [applied, page])

  function goToPage(target) {
    if (target === page) return
    setPage(target)
    setLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleFilterChange(next) {
    setFilters(next)

    const changed = Object.keys(next).filter((key) => next[key] !== filters[key])
    if (changed.some((key) => QUICK_FILTER_FIELDS.has(key))) {
      setApplied(next)
      setPage(0)
      setLoading(true)
      setPriceError(null)
    }
    if (changed.some((key) => key === 'minPrice' || key === 'maxPrice')) {
      setPriceError(null)
    }
  }

  function handleApplyPrice() {
    const min = filters.minPrice ? Number(filters.minPrice) : null
    const max = filters.maxPrice ? Number(filters.maxPrice) : null
    if (min != null && min < 0) {
      setPriceError('Minimum price cannot be negative.')
      return
    }
    if (max != null && max < 0) {
      setPriceError('Maximum price cannot be negative.')
      return
    }
    if (min != null && max != null && min > max) {
      setPriceError('Minimum price cannot be greater than the maximum.')
      return
    }

    setApplied(filters)
    setPage(0)
    setLoading(true)
    setPriceError(null)
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(0)
    setLoading(true)
    setPriceError(null)
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const from = rows.length > 0 ? currentPage * PAGE_SIZE + 1 : 0
  const to = currentPage * PAGE_SIZE + rows.length
  const visibleRows = useMemo(() => applySearch(rows, query), [rows, query])
  const searchActive = query.trim().length > 0

  return (
    <>
      <div className="listings-head">
        <h1>Listings</h1>
        <p className="tagline">
          Browse Pune properties. Server-side filters run through the <code>/api</code> proxy —
          the Axios interceptor keeps you authenticated.
        </p>
      </div>

      <div className="listings-layout">
        <FilterPanel
          filters={filters}
          priceError={priceError}
          onChange={handleFilterChange}
          onApplyPrice={handleApplyPrice}
          onReset={handleReset}
        />

        <section className="listings-main">
          {error ? (
            <div className="card">
              <EmptyState title="Something went wrong" message={error} />
            </div>
          ) : loading ? (
            <SkeletonGrid />
          ) : rows.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title="No listings found"
                message="No listings match the current filters."
                action={
                  <button type="button" className="btn-primary" onClick={handleReset}>
                    Clear filters
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <p className="results-info muted" aria-live="polite">
                Showing {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of{' '}
                {total.toLocaleString('en-IN')} result{total === 1 ? '' : 's'}
              </p>
              <SearchBar value={query} onChange={setQuery} />
              {searchActive && (
                <p className="search-hint muted" aria-live="polite">
                  {visibleRows.length === 1
                    ? '1 result matches your search.'
                    : `${visibleRows.length} of ${rows.length} results match your search.`}{' '}
                  Search filters these results locally on this page.
                </p>
              )}
              {visibleRows.length === 0 ? (
                <div className="card">
                  <EmptyState
                    icon={SearchX}
                    title="No matches"
                    message={`Nothing in these results matches "${query.trim()}".`}
                    action={
                      <button type="button" className="btn-primary" onClick={() => setQuery('')}>
                        Clear search
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="cards-grid">
                  {visibleRows.map((listing) => (
                    <ListingCard
                      key={listing.listing_id}
                      listing={listing}
                      saved={isSaved(listing.listing_id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              )}
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                loading={loading}
                onPageChange={goToPage}
              />
            </>
          )}

          {!loading && rows.length > 0 && !hasMore && (
            <p className="end-marker muted">You have reached the end of the results.</p>
          )}
        </section>
      </div>
    </>
  )
}