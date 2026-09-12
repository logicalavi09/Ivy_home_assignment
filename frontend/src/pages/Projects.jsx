import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import client from '../api/client'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import ProjectCard from '../components/ProjectCard'
import SkeletonGrid from '../components/SkeletonGrid'

const PAGE_SIZE = 50

export default function Projects() {
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    client
      .get('/v1/projects', { params: { limit: PAGE_SIZE, offset: page * PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return
        setRows(data.results || [])
        setTotal(data.total ?? 0)
        setHasMore(Boolean(data.has_more))
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setRows([])
        setError('We couldn\u2019t load projects right now. Please try again in a moment.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  function goToPage(target) {
    if (target === page) return
    setPage(target)
    setLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const from = rows.length > 0 ? currentPage * PAGE_SIZE + 1 : 0
  const to = currentPage * PAGE_SIZE + rows.length

  return (
    <>
      <div className="listings-head">
        <h1>Projects</h1>
        <p className="tagline">
          Builder projects across Pune. The price range reflects the project's
          <strong> min–max crore-scale pricing</strong> (e.g. ₹99.9 Cr) with the full rupee figure
          underneath.
        </p>
      </div>

      <section className="listings-main">
        {error ? (
          <div className="card">
            <EmptyState title="Something went wrong" message={error} />
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : rows.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Building2}
              title="No projects found"
              message="There are no projects to show right now."
            />
          </div>
        ) : (
          <>
            <p className="results-info muted" aria-live="polite">
              Showing {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of{' '}
              {total.toLocaleString('en-IN')} project{total === 1 ? '' : 's'}
            </p>
            <div className="cards-grid">
              {rows.map((project) => (
                <ProjectCard key={project.project_id} project={project} />
              ))}
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              loading={loading}
              onPageChange={goToPage}
              label="Project pages"
            />
          </>
        )}

        {!loading && rows.length > 0 && !hasMore && (
          <p className="end-marker muted">You have reached the end of the results.</p>
        )}
      </section>
    </>
  )
}