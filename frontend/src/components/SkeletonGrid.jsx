export default function SkeletonGrid({ count = 6, variant = 'listing' }) {
  return (
    <div className="cards-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="listing-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-price" />
          {variant === 'listing' && <div className="skeleton skeleton-meta" />}
        </div>
      ))}
    </div>
  )
}