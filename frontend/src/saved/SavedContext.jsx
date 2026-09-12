import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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

  const [savedListings, setSavedListings] = useState(() => getSavedListings(email))

  useEffect(() => {
    setSavedListings(getSavedListings(email))
  }, [email])

  const toggleSave = useCallback(
    (listing) => {
      if (!listing || !listing.listing_id) return
      const next = isSaved(email, listing.listing_id)
        ? unsaveListing(email, listing.listing_id)
        : saveListing(email, listing)
      setSavedListings([...next])
    },
    [email],
  )

  const removeSave = useCallback(
    (listingId) => {
      const next = unsaveListing(email, listingId)
      setSavedListings([...next])
    },
    [email],
  )

  const isListingSaved = useCallback((listingId) => isSaved(email, listingId), [email])

  const value = useMemo(
    () => ({
      email,
      savedListings,
      count: savedListings.length,
      isSaved: isListingSaved,
      toggleSave,
      removeSave,
    }),
    [email, savedListings, isListingSaved, toggleSave, removeSave],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export { SavedProvider, useSaved }