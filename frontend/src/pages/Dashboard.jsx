import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../auth/AuthContext'

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

  return (
    <>
      <h1>Welcome, {name}</h1>
      <p className="tagline">
        Your session is active. These counts are fetched with your access token via the
        <code> /api</code> proxy. The Authorization header is attached automatically by the Axios interceptor.
      </p>

      {error && (
        <section className="card bad">
          <p>{error}</p>
        </section>
      )}

      {summary && (
        <section className="card">
          <h2>Live totals (Pune)</h2>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-value">{summary.listings.toLocaleString()}</span>
              <span className="stat-label">Listings</span>
              <Link className="stat-link" to="/listings">
                Browse →
              </Link>
            </div>
            <div className="stat">
              <span className="stat-value">{summary.rentals.toLocaleString()}</span>
              <span className="stat-label">Rentals</span>
              <Link className="stat-link" to="/rentals">
                Browse →
              </Link>
            </div>
            <div className="stat">
              <span className="stat-value">{summary.projects.toLocaleString()}</span>
              <span className="stat-label">Projects</span>
              <Link className="stat-link" to="/projects">
                Browse →
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}