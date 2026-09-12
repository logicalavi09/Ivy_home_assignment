import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  getSavedListings,
  isSaved,
  saveListing,
  unsaveListing,
} from '../saved/savedStorage'

const SavedContext = createContext(null)

function useSaved() {
  const context = useContext(SavedContext)
  if (!context) {
    throw new Error('useSaved must be used within a <SavedProvider>.')
  }
  return context
}

function SavedProvider({ children }) {
  const { user } = useAuth()
  const email = user?.email || 'anonymous'

  const [state, setState] = useState(() => {
    const initialEmail = user?.email || 'anonymous'
    return { email: initialEmail, savedListings: getSavedListings(initialEmail) }
  })

  if (state.email !== email) {
    setState({ email, savedListings: getSavedListings(email) })
  }

  const toggleSave = useCallback(
    (listing) => {
      if (!listing || !listing.listing_id) return
      const next = isSaved(email, listing.listing_id)
        ? unsaveListing(email, listing.listing_id)
        : saveListing(email, listing)
      setState((prev) => ({ ...prev, savedListings: [...next] }))
    },
    [email],
  )

  const removeSave = useCallback(
    (listingId) => {
      const next = unsaveListing(email, listingId)
      setState((prev) => ({ ...prev, savedListings: [...next] }))
    },
    [email],
  )

  const upsertListing = useCallback(
    (listing) => {
      if (!listing || !listing.listing_id) return
      const next = getSavedListings(email).map((item) =>
        item.listing_id === listing.listing_id ? { ...item, ...listing } : item,
      )
      setState((prev) => ({ ...prev, savedListings: next }))
    },
    [email],
  )

  const isListingSaved = useCallback((listingId) => isSaved(email, listingId), [email])

  const value = useMemo(
    () => ({
      email,
      savedListings: state.savedListings,
      count: state.savedListings.length,
      isSaved: isListingSaved,
      toggleSave,
      removeSave,
      upsertListing,
    }),
    [email, state.savedListings, isListingSaved, toggleSave, removeSave, upsertListing],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export { SavedProvider, useSaved }