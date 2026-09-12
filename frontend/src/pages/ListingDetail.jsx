import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'
import { useSaved } from '../saved/SavedContext'
import { formatInr, titleCase } from '../listings/listingFormat'

function unwrapListing(data) {
  if (!data) return null
  if (data.listing) return data.listing
  if (Array.isArray(data.results) && data.results.length > 0) return data.results[0]
  if (Array.isArray(data) && data.length > 0) return data[0]
  if (typeof data === 'object' && data.listing_id) return data
  return null
}

function SkeletonDetail() {
  return (
    <div className="detail-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-price" />
      <div className="skeleton skeleton-meta" />
      <div className="skeleton skeleton-meta" />
    </div>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { savedListings, isSaved, toggleSave } = useSaved()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const listingId = decodeURIComponent(id || '')

    async function load() {
      setLoading(true)
      try {
        const { data } = await client.get(`/v1/listings/${encodeURIComponent(listingId)}`)
        const found = unwrapListing(data)
        if (!found) throw new Error(`No data returned for ${listingId}`)
        if (!cancelled) {
          setListing(found)
          setFetchFailed(false)
        }
      } catch {
        if (!cancelled) setFetchFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const listingId = decodeURIComponent(id || '')
  const effectiveListing = listing ?? (fetchFailed ? savedListings.find((item) => item.listing_id === listingId) : null)
  const saved = effectiveListing ? isSaved(effectiveListing.listing_id) : false

  function handleToggleSave() {
    if (effectiveListing) toggleSave(effectiveListing)
  }

  function fact(label, value) {
    return { label, value: value == null || value === '' ? 'N/A' : value }
  }

  if (loading) {
    return <SkeletonDetail />
  }

  if (!effectiveListing) {
    return (
      <div className="card empty-state">
        <h2>Listing not found</h2>
        <p className="muted">
          We couldn't find listing "{listingId}". It may not exist or is no longer available.
        </p>
        <Link className="ghost plain-link" to="/listings">
          ← Back to listings
        </Link>
      </div>
    )
  }

  const bhkValue =
    effectiveListing.bedroom > 0
      ? `${effectiveListing.bedroom} BHK`
      : effectiveListing.property_type
        ? titleCase(effectiveListing.property_type)
        : null

  const facts = [
    fact('BHK', bhkValue),
    fact('Bathrooms', effectiveListing.bathroom),
    fact('Balconies', effectiveListing.balcony),
    fact(
      'Floor',
      effectiveListing.floor != null
        ? `${effectiveListing.floor}${effectiveListing.total_floors ? ` of ${effectiveListing.total_floors}` : ''}`
        : null,
    ),
    fact('Facing', titleCase(effectiveListing.facing_direction)),
    fact('Covered parking', effectiveListing.covered_parking),
    fact(
      'Carpet area',
      effectiveListing.carpet_area != null
        ? `${effectiveListing.carpet_area.toLocaleString('en-IN')} sqft`
        : null,
    ),
    fact(
      'Super built-up',
      effectiveListing.super_built_up_area != null
        ? `${effectiveListing.super_built_up_area.toLocaleString('en-IN')} sqft`
        : null,
    ),
    fact('Furnishing', titleCase(effectiveListing.furnishing)),
    fact('Property type', titleCase(effectiveListing.property_type)),
    fact('Source', effectiveListing.website),
  ]

  return (
    <article className="detail">
      <Link className="back-link" to="/listings">
        ← Back to listings
      </Link>

      <header className="detail-head">
        <div>
          <h1>{effectiveListing.apartment_name || 'Untitled listing'}</h1>
          <p className="tagline">
            {titleCase(effectiveListing.locality)}
            {effectiveListing.listing_id ? ` · ${effectiveListing.listing_id}` : ''}
          </p>
        </div>
        <button
          type="button"
          className={`save-btn big${saved ? ' saved' : ''}`}
          aria-pressed={saved}
          onClick={handleToggleSave}
        >
          {saved ? '♥' : '♡'} {saved ? 'Saved' : 'Save'}
        </button>
      </header>

      <p className="detail-price">{formatInr(effectiveListing.price)}</p>

      <div className="detail-badges">
        {effectiveListing.is_verified && <span className="chip chip-verified">✓ Verified</span>}
        {effectiveListing.is_live === false && <span className="chip">Inactive</span>}
        {effectiveListing.property_type && <span className="chip">{titleCase(effectiveListing.property_type)}</span>}
      </div>

      <div className="detail-grid">
        <section className="card">
          <h2>Facts &amp; features</h2>
          {facts.length > 0 ? (
            <dl className="facts-grid">
              {facts.map((fact) => (
                <div className="fact" key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">No curated facts are available for this property.</p>
          )}
        </section>

        <aside className="detail-side">
          <section className="card">
            <h2>Posted by</h2>
            <p className="posted-name">
              {effectiveListing.posted_by_name || titleCase(effectiveListing.posted_by) || 'N/A'}
            </p>
            {effectiveListing.posted_by_contact ? (
              <p>
                <a className="plain-link" href={`tel:${effectiveListing.posted_by_contact}`}>
                  {effectiveListing.posted_by_contact}
                </a>
              </p>
            ) : (
              <p className="muted">N/A</p>
            )}
            {effectiveListing.project_id && (
              <div className="project-chip" title="Project details are coming soon">
                Project {effectiveListing.project_id}
              </div>
            )}
          </section>

          {effectiveListing.listing_url && (
            <section className="card">
              <h2>Source listing</h2>
              <p>
                <a className="plain-link" href={effectiveListing.listing_url} target="_blank" rel="noopener noreferrer">
                  {effectiveListing.website || 'View original listing'}
                </a>
              </p>
            </section>
          )}
        </aside>
      </div>

      <section className="card">
        <h2>Description</h2>
        <p className="description">{effectiveListing.description || 'No description provided for this property.'}</p>
      </section>
    </article>
  )
}