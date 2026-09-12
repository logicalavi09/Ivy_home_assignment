import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, RefreshCcw } from 'lucide-react'
import client from '../api/client'
import EmptyState from '../components/EmptyState'
import ListingCard from '../components/ListingCard'
import { hasListingBasicInfo, unwrapListing } from '../listings/listingFormat'
import { useSaved } from '../saved/SavedContext'

export default function SavedListings() {
  const { savedListings, toggleSave, upsertListing } = useSaved()

  const stale = useMemo(
    () => savedListings.filter((listing) => !hasListingBasicInfo(listing)),
    [savedListings],
  )

  useEffect(() => {
    if (stale.length === 0) return undefined
    let cancelled = false

    Promise.all(
      stale.map((listing) =>
        client
          .get(`/v1/listings/${encodeURIComponent(listing.listing_id)}`)
          .then(({ data }) => unwrapListing(data))
          .catch(() => null),
      ),
    ).then((resolved) => {
      if (cancelled) return
      resolved.forEach((full) => {
        if (full) upsertListing(full)
      })
    })

    return () => {
      cancelled = true
    }
  }, [stale, upsertListing])

  const empty = savedListings.length === 0

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Saved listings</h1>
          <p className="tagline">
            {savedListings.length > 0
              ? `${savedListings.length} saved ${savedListings.length === 1 ? 'property' : 'properties'}`
              : 'Properties you save appear here.'}
          </p>
        </div>
      </header>

      {empty ? (
        <div className="card">
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            message="Browse the listings and tap the heart on any property you like to keep it here for later."
            action={
              <Link className="btn btn-primary" to="/listings">
                Browse listings
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {stale.length > 0 && (
            <p className="muted results-info" aria-live="polite">
              <RefreshCcw size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Syncing details for {stale.length} saved {stale.length === 1 ? 'listing' : 'listings'}…
            </p>
          )}
          <div className="cards-grid">
            {savedListings.map((listing) => (
              <ListingCard
                key={listing.listing_id}
                listing={listing}
                saved
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}