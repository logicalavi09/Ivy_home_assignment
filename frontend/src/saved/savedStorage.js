function storageKey(emailOrUser) {
  const email = typeof emailOrUser === 'string' && emailOrUser ? emailOrUser : 'anonymous'
  return `saved_listings_${email}`
}

export function getSavedListings(emailOrUser) {
  try {
    const raw = localStorage.getItem(storageKey(emailOrUser))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSavedListings(emailOrUser, listings) {
  localStorage.setItem(storageKey(emailOrUser), JSON.stringify(listings))
}

export function isSaved(emailOrUser, listingId) {
  return getSavedListings(emailOrUser).some((listing) => listing.listing_id === listingId)
}

export function saveListing(emailOrUser, listing) {
  const current = getSavedListings(emailOrUser)
  if (!listing || !listing.listing_id) return current
  if (!current.some((item) => item.listing_id === listing.listing_id)) {
    current.push(listing)
  }
  writeSavedListings(emailOrUser, current)
  return current
}

export function unsaveListing(emailOrUser, listingId) {
  const current = getSavedListings(emailOrUser).filter((item) => item.listing_id !== listingId)
  writeSavedListings(emailOrUser, current)
  return current
}