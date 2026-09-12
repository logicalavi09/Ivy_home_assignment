import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Circle, MapPin, Users } from 'lucide-react'
import {
  formatCrorePrice,
  formatInrFull,
  projectPriceInr,
  titleCase,
} from '../listings/listingFormat'

export default function ProjectCard({ project }) {
  const minCr = formatCrorePrice(project.price_min)
  const maxCr = formatCrorePrice(project.price_max)
  const priceRange = minCr && maxCr ? `${minCr} – ${maxCr}` : minCr || maxCr || '—'

  const minInr = projectPriceInr(project.price_min)
  const maxInr = projectPriceInr(project.price_max)
  const inrRange =
    minInr != null && maxInr != null
      ? `${formatInrFull(minInr)} – ${formatInrFull(maxInr)}`
      : formatInrFull(minInr ?? maxInr)

  const areaRange =
    project.min_area_sqft && project.max_area_sqft
      ? `${project.min_area_sqft.toLocaleString('en-IN')}–${project.max_area_sqft.toLocaleString('en-IN')} sqft`
      : null

  return (
    <motion.article
      className="listing-card project-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      {project.project_id && (
        <Link
          className="listing-card-link"
          to={`/projects/${encodeURIComponent(project.project_id)}`}
          aria-label={`View listings for ${project.apartment_name || project.project_id}`}
        />
      )}

      <div className="listing-card-head">
        <h3 className="listing-title">{project.apartment_name || 'Untitled project'}</h3>
      </div>

      <p className="listing-locality">
        <MapPin size={13} aria-hidden="true" />
        {titleCase(project.locality)}
      </p>

      <p className="project-price">{priceRange}</p>
      <p className="project-price-inr">{inrRange}</p>

      <div className="project-centered">
        <span className="project-attr">{project.developer_name || 'N/A'}</span>
      </div>

      <dl className="listing-meta">
        <div className="listing-meta-item">
          <dt>
            <Building2 size={13} aria-hidden="true" /> Listings
          </dt>
          <dd>{project.total_listings != null ? project.total_listings.toLocaleString('en-IN') : '—'}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>
            <Users size={13} aria-hidden="true" /> Units
          </dt>
          <dd>{project.total_units != null ? project.total_units.toLocaleString('en-IN') : '—'}</dd>
        </div>
        <div className="listing-meta-item">
          <dt>
            <Circle size={13} aria-hidden="true" /> Status
          </dt>
          <dd>{titleCase(project.project_status)}</dd>
        </div>
      </dl>

      <div className="listing-badges">
        {areaRange && <span className="chip">{areaRange}</span>}
        {project.total_towers != null && <span className="chip">{project.total_towers} towers</span>}
        {project.rera_number && <span className="chip">RERA</span>}
        {project.project_url && (
          <a
            className="plain-link project-link"
            href={project.project_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            View project ↗
          </a>
        )}
      </div>
    </motion.article>
  )
}