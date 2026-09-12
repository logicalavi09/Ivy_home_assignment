import { Link } from 'react-router-dom'
import { areaText, formatInr, titleCase } from '../listings/listingFormat'

export default function ListingCard({ listing, saved = false, onToggleSave, linkToDetail = true }) {
  const id = listing.listing_id
  const bhk = listing.bedroom > 0 ? `${listing.bedroom} BHK` : titleCase(listing.property_type)
  const area = areaText(listing) || '—'

  return (
    <article className="listing-card">
      {linkToDetail && id && (
        <Link
          className="listing-card-link"
          to={`/listings/${encodeURIComponent(id)}`}
          aria-label={`View details for ${listing.apartment_name || id}`}
        />
      )}

      <div className="listing-card-head">
        <h3 className="listing-title">
          {listing.apartment_name || listing.name || 'Untitled listing'}
        </h3>
        <button
          type="button"
          className={`save-btn${saved ? ' saved' : ''}`}
          aria-label={saved ? 'Remove from saved' : 'Save listing'}
          aria-pressed={saved}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggleSave?.(listing)
          }}
        >
          {saved ? '♥' : '♡'}
        </button>
      </div>

      <p className="listing-locality">{titleCase(listing.locality)}</p>

      <p className="listing-price">{formatInr(listing.price)}</p>

      <dl className="listing-meta">
        <div className="listing-meta-item">
          <dt>BHK</dt>
          <dd>{bhk}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>Area</dt>
          <dd>{area}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>Furnishing</dt>
          <dd>{titleCase(listing.furnishing)}</dd>
        </div>
      </dl>

      <div className="listing-badges">
        {listing.is_verified && <span className="chip chip-verified">✓ Verified</span>}
        {listing.is_live && <span className="chip chip-live">● Live</span>}
      </div>
    </article>
  )
}