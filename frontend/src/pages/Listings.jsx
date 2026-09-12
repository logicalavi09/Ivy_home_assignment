import { useEffect, useState } from 'react'
import client from '../api/client'
import ListingCard from '../components/ListingCard'
import ListingFilters from '../components/ListingFilters'
import Pagination from '../components/Pagination'
import { EMPTY_FILTERS } from '../listings/filterOptions'

const PAGE_SIZE = 50
const PRICE_LAKHS_TO_INR = 1e5
const QUICK_FILTER_FIELDS = new Set(['locality', 'bhk', 'furnishing'])

function filtersToParams(filters) {
  const params = { limit: PAGE_SIZE }
  if (filters.locality) params.locality = filters.locality
  if (filters.bhk) {
    if (filters.bhk === '4+') {
      params.bedroom_gte = 4
    } else {
      params.bedroom = Number(filters.bhk)
    }
  }
  if (filters.furnishing) params.furnishing = filters.furnishing
  if (filters.minPrice) params.min_price = Math.round(Number(filters.minPrice) * PRICE_LAKHS_TO_INR)
  if (filters.maxPrice) params.max_price = Math.round(Number(filters.maxPrice) * PRICE_LAKHS_TO_INR)
  return params
}

function SkeletonGrid() {
  return (
    <div className="cards-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="listing-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-price" />
          <div className="skeleton skeleton-meta" />
        </div>
      ))}
    </div>
  )
}

export default function Listings() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [priceError, setPriceError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const params = { ...filtersToParams(applied), offset: page * PAGE_SIZE }

    client
      .get('/v1/listings', { params })
      .then(({ data }) => {
        if (cancelled) return
        setRows(data.results || [])
        setTotal(data.total ?? 0)
        setHasMore(Boolean(data.has_more))
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setRows([])
        setError(err?.message || 'Failed to load listings.')
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
        <ListingFilters
          filters={filters}
          priceError={priceError}
          onChange={handleFilterChange}
          onApplyPrice={handleApplyPrice}
          onReset={handleReset}
        />

        <section className="listings-main">
          {error ? (
            <div className="card bad">
              <p>{error}</p>
            </div>
          ) : loading ? (
            <SkeletonGrid />
          ) : rows.length === 0 ? (
            <div className="card empty-state">
              <h2>No results found</h2>
              <p className="muted">No listings match the current filters.</p>
              <button type="button" className="ghost" onClick={handleReset}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="results-info muted" aria-live="polite">
                Showing {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of{' '}
                {total.toLocaleString('en-IN')} result{total === 1 ? '' : 's'}
              </p>
              <div className="cards-grid">
                {rows.map((listing) => (
                  <ListingCard key={listing.listing_id} listing={listing} />
                ))}
              </div>
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