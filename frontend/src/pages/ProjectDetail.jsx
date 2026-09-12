import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Link2Off, SearchX } from 'lucide-react'
import client from '../api/client'
import EmptyState from '../components/EmptyState'
import ListingCard from '../components/ListingCard'
import SkeletonGrid from '../components/SkeletonGrid'
import {
  formatCrorePrice,
  formatInrFull,
  projectPriceInr,
  titleCase,
} from '../listings/listingFormat'
import { useSaved } from '../saved/SavedContext'

function unwrapProject(data) {
  if (!data) return null
  if (data.project) return data.project
  if (Array.isArray(data.results) && data.results.length > 0) return data.results[0]
  if (Array.isArray(data) && data.length > 0) return data[0]
  if (typeof data === 'object' && data.project_id) return data
  return null
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { isSaved, toggleSave } = useSaved()

  const [project, setProject] = useState(null)
  const [projectError, setProjectError] = useState(null)
  const [listingRows, setListingRows] = useState([])
  const [listingUnsupported, setListingUnsupported] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listingLoading, setListingLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const projectId = decodeURIComponent(id || '')

    async function loadProject(idValue) {
      try {
        const { data } = await client.get(`/v1/projects/${encodeURIComponent(idValue)}`)
        return unwrapProject(data)
      } catch {
        return null
      }
    }

    async function load() {
      let found = await loadProject(projectId)
      if (!found) {
        try {
          const { data } = await client.get('/v1/projects', {
            params: { project_id: projectId, limit: 1 },
          })
          found = unwrapProject(data)
        } catch {
          found = null
        }
      }
      if (!cancelled) {
        if (found) {
          setProject(found)
          setProjectError(null)
        } else {
          setProject(null)
          setProjectError(`We couldn't find project "${projectId}".`)
        }
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    const projectId = decodeURIComponent(id || '')

    async function loadListings() {
      setListingLoading(true)
      try {
        const { data } = await client.get('/v1/listings', {
          params: { project_id: projectId, limit: 50 },
        })
        if (cancelled) return
        const rows = data.results || []
        const matching = rows.filter((row) => String(row.project_id) === projectId)
        const supported = rows.length > 0 ? matching.length > 0 : true
        setListingRows(matching)
        setListingUnsupported(rows.length > 0 && !supported)
      } catch {
        if (cancelled) return
        setListingRows([])
        setListingUnsupported(false)
      } finally {
        if (!cancelled) setListingLoading(false)
      }
    }

    loadListings()
    return () => {
      cancelled = true
    }
  }, [id])

  const minCr = formatCrorePrice(project?.price_min)
  const maxCr = formatCrorePrice(project?.price_max)
  const priceRange = minCr && maxCr ? `${minCr} – ${maxCr}` : minCr || maxCr || '—'
  const minInr = projectPriceInr(project?.price_min)
  const maxInr = projectPriceInr(project?.price_max)
  const inrFull =
    minInr != null && maxInr != null
      ? `${formatInrFull(minInr)} – ${formatInrFull(maxInr)}`
      : formatInrFull(minInr ?? maxInr)

  function fact(label, value) {
    return { label, value: value == null || value === '' ? 'N/A' : value }
  }

  if (loading) {
    return (
      <div className="detail-skeleton" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-price" />
        <div className="skeleton skeleton-meta" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="card">
        <EmptyState
          icon={SearchX}
          title="Project not found"
          message={projectError || 'This project could not be loaded.'}
          action={
            <Link className="btn btn-primary" to="/projects">
              ← Back to projects
            </Link>
          }
        />
      </div>
    )
  }

  const facts = [
    fact('Developer', project.developer_name),
    fact('Locality', titleCase(project.locality)),
    fact('Reported Listings', project.total_listings != null ? project.total_listings.toLocaleString('en-IN') : null),
    fact('Total Units', project.total_units != null ? project.total_units.toLocaleString('en-IN') : null),
    fact('Status', titleCase(project.project_status)),
    fact(
      'Area range',
      project.min_area_sqft && project.max_area_sqft
        ? `${project.min_area_sqft.toLocaleString('en-IN')}–${project.max_area_sqft.toLocaleString('en-IN')} sqft`
        : null,
    ),
    fact('Towers', project.total_towers),
    fact('Total Floors', project.total_floors),
    fact('Possession', project.possession_date),
    fact('RERA', project.rera_number),
  ]

  return (
    <article className="detail">
      <Link className="back-link" to="/projects">
        <ArrowLeft size={15} aria-hidden="true" /> Back to projects
      </Link>

      <header className="detail-head">
        <div>
          <h1>{project.apartment_name || 'Untitled project'}</h1>
          <p className="tagline">
            {titleCase(project.locality)}
            {project.project_id ? ` · ${project.project_id}` : ''}
          </p>
        </div>
      </header>

      <p className="detail-price">{priceRange}</p>
      <p className="project-price-inr">{inrFull}</p>

      <div className="detail-grid">
        <section className="card">
          <h2>Project facts</h2>
          <dl className="facts-grid">
            {facts.map((item) => (
              <div className="fact" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          {project.project_url && (
            <p>
              <a className="plain-link" href={project.project_url} target="_blank" rel="noopener noreferrer">
                Open on ivy.homes ↗
              </a>
            </p>
          )}
        </section>

        <aside className="detail-side">
          <section className="card">
            <h2>Listings in this project</h2>
            <p className="posted-name">
              {listingLoading && !listingUnsupported ? (
                <span className="skeleton skeleton-line" style={{ display: 'block', width: 120 }} />
              ) : (
                `${listingRows.length} listing${listingRows.length === 1 ? '' : 's'} linked`
              )}
            </p>
            <p className="muted">
              {listingLoading
                ? 'Fetching listings…'
                : listingUnsupported
                  ? 'The API did not filter listings by project; browse all listings instead.'
                  : 'Fetched from the listings endpoint by project_id.'}
            </p>
          </section>
        </aside>
      </div>

      <h2>Listings belonging to {project.apartment_name || 'this project'}</h2>

      {listingLoading ? (
        <SkeletonGrid />
      ) : listingRows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={listingUnsupported ? Link2Off : Building2}
            title="No listings linked"
            message={
              listingUnsupported
                ? 'The listings API did not return results filtered by this project id.'
                : 'No listings are currently associated with this project.'
            }
            action={
              <Link className="btn btn-primary" to="/listings">
                Browse all listings
              </Link>
            }
          />
        </div>
      ) : (
        <div className="cards-grid">
          {listingRows.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              saved={isSaved(listing.listing_id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </article>
  )
}