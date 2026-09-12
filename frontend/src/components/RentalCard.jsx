import { areaText, formatInr, titleCase } from '../listings/listingFormat'

export default function RentalCard({ rental }) {
  const bhk = rental.bedroom > 0 ? `${rental.bedroom} BHK` : titleCase(rental.property_type)

  return (
    <article className="listing-card rental-card">
      <div className="listing-card-head">
        <h3 className="listing-title">{rental.apartment_name || rental.title || 'Untitled rental'}</h3>
      </div>

      <p className="listing-locality">{titleCase(rental.locality)}</p>

      <div className="rent-price">
        <span className="rent-price-label">Monthly Rent</span>
        <span className="rent-price-value">{formatInr(rental.price)} / month</span>
      </div>

      <dl className="listing-meta">
        <div className="listing-meta-item">
          <dt>BHK</dt>
          <dd>{bhk}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>Area</dt>
          <dd>{areaText(rental) || '—'}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>Furnishing</dt>
          <dd>{titleCase(rental.furnishing)}</dd>
        </div>
      </dl>

      {(rental.deposit != null || rental.maintenance != null) && (
        <dl className="rent-extra">
          {rental.deposit != null && (
            <div className="listing-meta-item">
              <dt>Deposit</dt>
              <dd>{formatInr(rental.deposit)}</dd>
            </div>
          )}
          {rental.maintenance != null && (
            <div className="listing-meta-item">
              <dt>Maintenance</dt>
              <dd>{formatInr(rental.maintenance)}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="listing-badges">
        {rental.is_live && <span className="chip chip-live">● Live</span>}
        {rental.property_type && <span className="chip">{titleCase(rental.property_type)}</span>}
      </div>
    </article>
  )
}