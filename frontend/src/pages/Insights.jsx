import { useEffect, useState } from 'react'
import client from '../api/client'
import IdListModal from '../components/IdListModal'
import { formatInr, formatInrFull, titleCase } from '../listings/listingFormat'
import {
  VALIDATED_ACTIVE_LISTINGS,
  VALIDATED_LOCALITY_COUNTS,
  VALIDATED_MEDIAN_PRICE,
  VALIDATED_TOTAL_LISTINGS,
} from '../insights/insightsData'
import submission from '../../../submission.json'

const ANSWERS = submission.answers

function unwrapSummary(data) {
  if (!data) return null
  if (data.summary && typeof data.summary === 'object') return data.summary
  if (data.data && typeof data.data === 'object') return data.data
  return data
}

function normalizeLocalities(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item) => ({
        label: item.locality || item.label || item.name,
        value: Number(item.count ?? item.value ?? item.total ?? 0),
      }))
      .filter((item) => item.label && item.value > 0)
  }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .map(([label, value]) => ({ label, value: Number(value) }))
      .filter((item) => item.value > 0)
  }
  return []
}

function extractMedian(raw) {
  if (raw == null) return null
  const value =
    raw.median_price ?? raw.medianPrice ?? raw.price_median ?? raw['median price']
  return value == null || Number.isNaN(Number(value)) ? null : Number(value)
}

function LocalityBars({ rows }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const max = Math.max(...sorted.map((row) => row.value), 1)
  return (
    <div className="bar-list">
      {sorted.map((row) => (
        <div className="bar-row" key={row.label}>
          <span className="bar-label">{titleCase(row.label)}</span>
          <div className="bar-track" aria-hidden="true">
            <div className="bar-fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span className="bar-value">{row.value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

function statTiles(localities, median, total, active) {
  const top = [...localities].sort((a, b) => b.value - a.value)[0]
  return [
    { label: 'Median price', value: formatInrFull(median), sub: `≈ ${formatInr(median)}` },
    { label: 'Total listings', value: total.toLocaleString('en-IN') },
    { label: 'Active listings', value: active.toLocaleString('en-IN') },
    {
      label: 'Top locality',
      value: top ? titleCase(top.label) : '—',
      sub: top ? `${top.value.toLocaleString('en-IN')} listings` : null,
    },
  ]
}

export default function Insights() {
  const [summary, setSummary] = useState(null)
  const [summaryStatus, setSummaryStatus] = useState('loading')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    let cancelled = false

    client
      .get('/v1/analytics/summary')
      .then(({ data }) => {
        if (cancelled) return
        const unwrapped = unwrapSummary(data)
        setSummary(unwrapped)
        setSummaryStatus(unwrapped ? 'live' : 'fallback')
      })
      .catch(() => {
        if (cancelled) return
        setSummary(null)
        setSummaryStatus('fallback')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const liveLocalities = normalizeLocalities(
    summary?.listings_by_locality ?? summary?.localities ?? summary?.by_locality,
  )
  const liveMedian = extractMedian(summary)

  const localityRows =
    summaryStatus === 'live' && liveLocalities.length > 0
      ? liveLocalities
      : VALIDATED_LOCALITY_COUNTS.map((item) => ({ label: item.locality, value: item.count }))

  const medianPrice =
    summaryStatus === 'live' && liveMedian != null ? liveMedian : VALIDATED_MEDIAN_PRICE
  const totalListings =
    summaryStatus === 'live' && summary?.total_listings != null
      ? Number(summary.total_listings)
      : VALIDATED_TOTAL_LISTINGS
  const activeListings =
    summaryStatus === 'live' && summary?.active_listings != null
      ? Number(summary.active_listings)
      : VALIDATED_ACTIVE_LISTINGS

  const tiles = statTiles(localityRows, medianPrice, totalListings, activeListings)

  const discrepancyRows = [
    {
      endpoint: '/v1/listings',
      label: 'Listings',
      reported: '3,543',
      retrieved: '3,800',
      delta: '+257',
      note: 'the reported total hid 257 retrievable records',
    },
    {
      endpoint: '/v1/rentals',
      label: 'Rentals',
      reported: '1,352',
      retrieved: '1,450',
      delta: '+98',
      note: 'the reported total hid 98 retrievable records',
    },
    {
      endpoint: '/v1/projects',
      label: 'Projects',
      reported: '410',
      retrieved: '440',
      delta: '+30',
      note: 'the reported total hid 30 retrievable records',
    },
    {
      endpoint: '/v1/projects',
      label: 'Projects with wrong listing counts',
      reported: '—',
      retrieved: String(ANSWERS.projects_with_wrong_listing_count),
      delta: `${ANSWERS.projects_with_wrong_listing_count} affected`,
      note: 'total_listings disagrees with the actual linked-listing count',
    },
  ]

  const lies = [
    {
      category: 'Auth',
      documented: 'API key sent as the api_key query parameter.',
      actual: 'The endpoint rejects the query parameter and requires the X-API-Key request header.',
      endpoint: '/v1/listings',
    },
    {
      category: 'Pagination',
      documented: 'page / page_size request and response contract.',
      actual: 'The API uses offset / limit, and total undercounts the retrievable dataset.',
      endpoint: '/v1/listings',
    },
    {
      category: 'Unit scaling',
      documented: 'Project price fields are presented as prices.',
      actual: 'price_max is crore-scale — 99.9 on P30394 means ₹99.90 Cr (₹99,90,00,000), not ₹99.9.',
      endpoint: '/v1/projects',
    },
    {
      category: 'Auth session',
      documented: 'Access token expires_in = 86400 with no refresh flow.',
      actual: 'Tokens expire in 900s and a refresh_token + /auth/refresh flow is required.',
      endpoint: '/auth/login',
    },
  ]

  const questions = [
    { q: 'Q1', label: 'Total listable records on /v1/listings', answer: '3,800' },
    { q: 'Q2', label: 'Unique properties (listing_id duplicates checked)', answer: '3,800' },
    { q: 'Q3', label: 'Active listings (is_live = true)', answer: '2,998' },
    {
      q: 'Q4',
      label: 'Obvious corrupt / impossible listings',
      answer: `${ANSWERS.corrupt_listing_ids.length} IDs`,
      ids: ANSWERS.corrupt_listing_ids,
    },
    {
      q: 'Q5',
      label: 'Total monthly rent — Hadapsar rentals',
      answer: formatInrFull(ANSWERS.total_monthly_rent),
    },
    {
      q: 'Q6',
      label: 'Average ₹ / sq ft — 2 BHK listings',
      answer: `₹${Number(ANSWERS.avg_price_per_sqft_2bhk).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      q: 'Q7',
      label: 'Costliest project (by price_max)',
      answer: `${ANSWERS.costliest_project.project_id} · ${formatInrFull(ANSWERS.costliest_project.price_max_inr)}`,
    },
    {
      q: 'Q8',
      label: 'Listings posted in the last 7 days',
      answer: String(ANSWERS.listings_last_7_days),
    },
    {
      q: 'Q9',
      label: 'Fake listings',
      answer: `${ANSWERS.fake_listing_ids.length} IDs`,
      ids: ANSWERS.fake_listing_ids,
    },
    {
      q: 'Q10',
      label: 'Projects with a wrong reported listing count',
      answer: String(ANSWERS.projects_with_wrong_listing_count),
    },
  ]

  const healthy = VALIDATED_TOTAL_LISTINGS - ANSWERS.corrupt_listing_ids.length - ANSWERS.fake_listing_ids.length
  const composition = [
    { label: 'Healthy', value: healthy },
    { label: 'Corrupt', value: ANSWERS.corrupt_listing_ids.length },
    { label: 'Fake', value: ANSWERS.fake_listing_ids.length },
  ]
  const compositionTotal = Math.max(healthy + ANSWERS.corrupt_listing_ids.length + ANSWERS.fake_listing_ids.length, 1)

  return (
    <>
      <div className="listings-head">
        <h1>Insights Dashboard</h1>
        <p className="tagline">
          A two-part analyst view: the live <code>/v1/analytics/summary</code> endpoint, and the
          data-discovery findings from our Phase 1 investigation. Answers match{' '}
          <code>submission.json</code> exactly.
        </p>
      </div>

      {modal && <IdListModal title={modal.title} ids={modal.ids} onClose={() => setModal(null)} />}

      <h2 className="section-title">Part A — API Summary</h2>
      {summaryStatus === 'loading' ? (
        <div className="card insight-skeleton" aria-hidden="true">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-meta" />
        </div>
      ) : (
        <section className="card">
          {summaryStatus === 'fallback' && (
            <p className="notice" aria-live="polite">
              <code>GET /v1/analytics/summary</code> returned an error on the live API, so this
              panel shows the <strong>validated numbers</strong> from our investigation (computed
              from the same dataset that produced <code>submission.json</code>).
            </p>
          )}

          <div className="insights-grid">
            <div className="stat-grid insight-stats">
              {tiles.map((stat) => (
                <div className="stat" key={stat.label}>
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                  {stat.sub && <span className="stat-sub">{stat.sub}</span>}
                </div>
              ))}
            </div>

            <div className="insights-chart">
              <h3>Listings by locality</h3>
              <LocalityBars rows={localityRows} />
            </div>
          </div>
        </section>
      )}

      <h2 className="section-title">Part B — Data Discovery: what the docs got wrong</h2>

      <div className="dashboard-grid">
        <section className="card">
          <h3>Dataset discrepancies</h3>
          <div className="discrepancy-list">
            {discrepancyRows.map((row) => {
              const reported = Number(row.reported.replace(/[^\d]/g, '')) || 0
              const retrieved = Number(row.retrieved.replace(/[^\d]/g, '')) || 0
              return (
                <div className="discrepancy" key={row.label}>
                  <div className="discrepancy-head">
                    <span className="discrepancy-label">{row.label}</span>
                    <code className="discrepancy-endpoint">{row.endpoint}</code>
                  </div>
                  <div className="compare-bars">
                    <div className="compare-row">
                      <span className="compare-name">reported</span>
                      <div className="compare-track">
                        <div
                          className="compare-fill muted-fill"
                          style={{ width: `${retrieved ? Math.round((reported / retrieved) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="compare-value">{row.reported}</span>
                    </div>
                    <div className="compare-row">
                      <span className="compare-name">retrieved</span>
                      <div className="compare-track">
                        <div className="compare-fill" style={{ width: '100%' }} />
                      </div>
                      <span className="compare-value">{row.retrieved}</span>
                    </div>
                  </div>
                  <p className="discrepancy-note">
                    <span className="delta">{row.delta}</span> — {row.note}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card">
          <h3>Categories of lies</h3>
          <ul className="lies-list">
            {lies.map((lie) => (
              <li key={lie.category} className="lie">
                <div className="lie-head">
                  <strong>{lie.category}</strong>
                  <code>{lie.endpoint}</code>
                </div>
                <p className="lie-doc">Documented: {lie.documented}</p>
                <p className="lie-actual">Actual: {lie.actual}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h2 className="section-title">Dataset composition</h2>
      <section className="card">
        <div className="stack-track" aria-hidden="true">
          {composition.map((segment) => (
            <div
              key={segment.label}
              className={`stack-segment ${segment.label.toLowerCase()}`}
              style={{ width: `${(segment.value / compositionTotal) * 100}%` }}
              title={`${segment.label}: ${segment.value}`}
            />
          ))}
        </div>
        <div className="stack-legend">
          {composition.map((segment) => (
            <span key={segment.label} className="stack-legend-item">
              <span className={`stack-dot ${segment.label.toLowerCase()}`} />
              {segment.label} · {segment.value.toLocaleString('en-IN')}
            </span>
          ))}
        </div>
      </section>

      <h2 className="section-title">Answers to the 10 assignment questions</h2>
      <section className="card">
        <div className="qa-grid">
          {questions.map((item) => (
            <div className="qa" key={item.q}>
              <span className="qa-q">{item.q}</span>
              <p className="qa-label">{item.label}</p>
              <p className="qa-answer">{item.answer}</p>
              {item.ids && (
                <button
                  type="button"
                  className="ghost small"
                  onClick={() =>
                    setModal({
                      title: `${item.q} — ${item.label} (${item.ids.length} IDs)`,
                      ids: item.ids,
                    })
                  }
                >
                  View all ({item.ids.length}) IDs
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}