import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BedDouble, MapPin, Ruler, Sofa } from 'lucide-react'
import { areaText, formatInr, titleCase } from '../listings/listingFormat'

export default function ListingCard({ listing, saved = false, onToggleSave, linkToDetail = true }) {
  const id = listing.listing_id
  const bhk = listing.bedroom > 0 ? `${listing.bedroom} BHK` : titleCase(listing.property_type)
  const area = areaText(listing) || '—'

  return (
    <motion.article
      className="listing-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
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

      <p className="listing-locality">
        <MapPin size={13} aria-hidden="true" />
        {titleCase(listing.locality)}
      </p>

      <p className="listing-price">{formatInr(listing.price)}</p>

      <dl className="listing-meta">
        <div className="listing-meta-item">
          <dt>
            <BedDouble size={13} aria-hidden="true" /> BHK
          </dt>
          <dd>{bhk}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>
            <Ruler size={13} aria-hidden="true" /> Area
          </dt>
          <dd>{area}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>
            <Sofa size={13} aria-hidden="true" /> Furnishing
          </dt>
          <dd>{titleCase(listing.furnishing)}</dd>
        </div>
      </dl>

      <div className="listing-badges">
        {listing.is_verified && <span className="chip chip-verified">✓ Verified</span>}
        {listing.is_live && <span className="chip chip-live">● Live</span>}
      </div>
    </motion.article>
  )
}