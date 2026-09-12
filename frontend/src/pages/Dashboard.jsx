import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Building2, Home } from 'lucide-react'
import client from '../api/client'
import { useAuth } from '../auth/AuthContext'
import CountUp from '../components/CountUp'
import SkeletonGrid from '../components/SkeletonGrid'

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      client.get('/v1/listings', { params: { limit: 1 } }),
      client.get('/v1/rentals', { params: { limit: 1 } }),
      client.get('/v1/projects', { params: { limit: 1 } }),
    ])
      .then(([listings, rentals, projects]) => {
        if (!cancelled) {
          setSummary({
            listings: listings.data.total,
            rentals: rentals.data.total,
            projects: projects.data.total,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setError('We couldn\u2019t load the dashboard right now. Please try again in a moment.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const name = user?.name || user?.full_name || user?.email || 'there'
  const firstName = String(name).split(/\s+/)[0]

  const tiles = [
    {
      to: '/listings',
      icon: Home,
      label: 'Listings',
      value: summary?.listings ?? null,
      cta: 'Browse properties',
    },
    {
      to: '/rentals',
      icon: Building2,
      label: 'Rentals',
      value: summary?.rentals ?? null,
      cta: 'Browse rentals',
    },
    {
      to: '/projects',
      icon: Building2,
      label: 'Projects',
      value: summary?.projects ?? null,
      cta: 'Browse projects',
    },
    {
      to: '/insights',
      icon: BarChart3,
      label: 'Insights',
      value: null,
      cta: 'View data findings',
    },
  ]

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p className="tagline">
            Live totals for Pune, fetched through the <code>/api</code> proxy with your session token.
          </p>
        </div>
      </header>

      {error && (
        <section className="card">
          <p className="bad">{error}</p>
        </section>
      )}

      {summary ? (
        <div className="stat-grid bento-grid">
          {tiles.map(({ to, icon: Icon, label, value, cta }) => (
            <Link
              key={to}
              to={to}
              className="stat bento-card"
              style={{ textDecoration: 'none' }}
            >
              <span className="stat-icon">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="stat-value">
                {value == null ? (
                  'Explore'
                ) : (
                  <CountUp to={value} format={(v) => v.toLocaleString('en-IN')} />
                )}
              </span>
              <span className="stat-label">{label}</span>
              <span className="stat-link">
                {cta} <ArrowRight size={13} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        !error && <SkeletonGrid count={4} />
      )}

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Your workspace</h2>
        <p className="muted" style={{ margin: 0 }}>
          Dive into the <Link to="/listings">listings browser</Link>, check out{' '}
          <Link to="/rentals">rentals</Link> and <Link to="/projects">projects</Link>, or open the{' '}
          <Link to="/insights">Insights dashboard</Link> to see what the API documentation got wrong.
          Saved properties live under <Link to="/saved">Saved</Link>.
        </p>
      </section>
    </div>
  )
}