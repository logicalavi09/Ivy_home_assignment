import { useEffect, useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import client from '../api/client'
import EmptyState from '../components/EmptyState'
import FilterPanel from '../components/FilterPanel'
import Pagination from '../components/Pagination'
import RentalCard from '../components/RentalCard'
import SearchBar from '../components/SearchBar'
import SkeletonGrid from '../components/SkeletonGrid'
import { applySearch } from '../listings/localSearch'
import { EMPTY_FILTERS, filtersToParams } from '../listings/filterOptions'

const PAGE_SIZE = 50
const QUICK_FILTER_FIELDS = new Set(['locality', 'bhk', 'furnishing'])

export default function Rentals() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const params = { ...filtersToParams(applied, PAGE_SIZE), offset: page * PAGE_SIZE }

    client
      .get('/v1/rentals', { params })
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
        setError('We couldn\u2019t load rentals right now. Please try again in a moment.')
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
    }
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(0)
    setLoading(true)
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
        <h1>Rentals</h1>
        <p className="tagline">
          Rental properties across Pune. The card price is the <strong>monthly rent</strong> in
          Indian Rupees, with deposit and maintenance alongside.
        </p>
      </div>

      <div className="listings-layout">
        <FilterPanel filters={filters} showPrice={false} onChange={handleFilterChange} onReset={handleReset} />

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
                title="No rentals found"
                message="No rentals match the current filters."
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
                {total.toLocaleString('en-IN')} rental{total === 1 ? '' : 's'}
              </p>
              <SearchBar value={query} onChange={setQuery} placeholder="Search rentals or keywords…" />
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
                  {visibleRows.map((rental) => (
                    <RentalCard key={rental.listing_id} rental={rental} />
                  ))}
                </div>
              )}
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                loading={loading}
                onPageChange={goToPage}
                label="Rental pages"
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