import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import ListingFilters from './ListingFilters'

export default function FilterPanel(props) {
  const { filters } = props
  const [open, setOpen] = useState(false)

  const activeCount = [
    filters?.locality,
    filters?.bhk,
    filters?.furnishing,
    filters?.minPrice,
    filters?.maxPrice,
  ].filter(Boolean).length

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="filters-toggle"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filters
        {activeCount > 0 && <span className="badge">{activeCount}</span>}
      </button>

      <div className="filters-column">
        <ListingFilters {...props} />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="drawer-backdrop"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ x: -340 }}
              animate={{ x: 0 }}
              exit={{ x: -340 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="filter-drawer-head">
                <h2>Filters</h2>
                <button type="button" className="ghost small" onClick={() => setOpen(false)} aria-label="Close filters">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <ListingFilters {...props} />
              <button type="button" className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => setOpen(false)}>
                Show results
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}