function titleCase(value) {
  if (!value) return '—'
  return String(value).replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatInr(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const amount = Number(value)
  if (amount <= 0) return '—'
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export default function ListingCard({ listing }) {
  const bhk = listing.bedroom > 0 ? `${listing.bedroom} BHK` : titleCase(listing.property_type)
  const area = listing.carpet_area
    ? `${listing.carpet_area.toLocaleString('en-IN')} sqft`
    : listing.super_built_up_area
      ? `${listing.super_built_up_area.toLocaleString('en-IN')} sqft`
      : '—'

  return (
    <article className="listing-card">
      <div className="listing-card-head">
        <h3 className="listing-title">
          {listing.apartment_name || listing.name || 'Untitled listing'}
        </h3>
        <div className="listing-badges">
          {listing.is_verified && <span className="chip chip-verified">✓ Verified</span>}
          {listing.is_live && <span className="chip chip-live">● Live</span>}
        </div>
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
    </article>
  )
}