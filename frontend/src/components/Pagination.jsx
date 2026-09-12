function pageItems(current, count) {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index + 1)
  }

  const items = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  if (start > 2) items.push('…start')
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < count - 1) items.push('…end')
  items.push(count)
  return items
}

export default function Pagination({ page, pageCount, loading, onPageChange, label = 'Listings pages' }) {
  if (pageCount <= 1) return null

  const currentPage = Math.min(page, pageCount - 1)
  const items = pageItems(currentPage, pageCount)

  function goto(target) {
    if (!loading && target !== currentPage && target >= 0 && target < pageCount) {
      onPageChange(target)
    }
  }

  return (
    <nav className="pager" aria-label={label}>
      <button type="button" disabled={loading || currentPage === 0} onClick={() => goto(0)}>
        First
      </button>
      <button
        type="button"
        disabled={loading || currentPage === 0}
        onClick={() => goto(currentPage - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>

      {items.map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className={`page-number${item - 1 === currentPage ? ' active' : ''}`}
            disabled={loading}
            aria-current={item - 1 === currentPage ? 'page' : undefined}
            onClick={() => goto(item - 1)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="page-ellipsis" aria-hidden="true">
            …
          </span>
        ),
      )}

      <button
        type="button"
        disabled={loading || currentPage >= pageCount - 1}
        onClick={() => goto(currentPage + 1)}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        type="button"
        disabled={loading || currentPage >= pageCount - 1}
        onClick={() => goto(pageCount - 1)}
      >
        Last
      </button>
    </nav>
  )
}