export function titleCase(value) {
  if (!value) return '—'
  return String(value).replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatInr(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const amount = Number(value)
  if (amount <= 0) return '—'
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function formatInrFull(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  const amount = Number(value)
  if (amount <= 0) return null
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function formatCrorePrice(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  const amount = Number(value)
  if (amount <= 0) return null
  return `₹${amount.toFixed(2)} Cr`
}

export function projectPriceInr(value) {
  if (value == null || Number.isNaN(Number(value))) return null
  return Number(value) * 1e7
}

export function areaText(listing) {
  if (listing.carpet_area) return `${listing.carpet_area.toLocaleString('en-IN')} sqft`
  if (listing.super_built_up_area) return `${listing.super_built_up_area.toLocaleString('en-IN')} sqft`
  if (listing.super_builtup_area) return `${listing.super_builtup_area.toLocaleString('en-IN')} sqft`
  return null
}

export function unwrapListing(data) {
  if (!data) return null
  if (data.listing) return data.listing
  if (Array.isArray(data.results) && data.results.length > 0) return data.results[0]
  if (Array.isArray(data) && data.length > 0) return data[0]
  if (typeof data === 'object' && data.listing_id) return data
  return null
}

export function hasListingBasicInfo(listing) {
  if (!listing || !listing.listing_id) return false
  const hasName = listing.apartment_name || listing.title || listing.name
  const hasValue = listing.price != null || listing.locality
  return Boolean(hasName && hasValue)
}